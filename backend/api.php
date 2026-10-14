
<?php
session_start();

header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Origin: http://localhost:5173");
header("Access-Control-Allow-Credentials: true");
header("Access-Control-Allow-Headers: Content-Type");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");

if ($_SERVER["REQUEST_METHOD"] === "OPTIONS") {
    http_response_code(204);
    exit;
}

require_once "db.php";

function respond($data, $status = 200) {
    http_response_code($status);
    echo json_encode($data);
    exit;
}

$action = $_GET["action"] ?? "";
$input = json_decode(file_get_contents("php://input"), true) ?? [];

try {
    if ($action === "register") {
        $name = trim($input["name"] ?? "");
        $email = strtolower(trim($input["email"] ?? ""));
        $password = $input["password"] ?? "";

        if ($name === "" || !filter_var($email, FILTER_VALIDATE_EMAIL)
            || strlen($password) < 8) {
            respond([
                "error" => "Enter a name, valid email, and password of at least 8 characters."
            ], 422);
        }

        $hash = password_hash($password, PASSWORD_DEFAULT);

        $stmt = $pdo->prepare(
            "INSERT INTO students (name, email, password, skills)
             VALUES (?, ?, ?, '')"
        );
        $stmt->execute([$name, $email, $hash]);

        session_regenerate_id(true);
        $_SESSION["student_id"] = (int)$pdo->lastInsertId();

        respond(["message" => "Registration successful"]);
    }

    if ($action === "login") {
        $email = strtolower(trim($input["email"] ?? ""));
        $password = $input["password"] ?? "";

        $stmt = $pdo->prepare(
            "SELECT id, password FROM students WHERE email = ?"
        );
        $stmt->execute([$email]);
        $student = $stmt->fetch();

        if (!$student || !password_verify($password, $student["password"])) {
            respond(["error" => "Invalid email or password"], 401);
        }

        session_regenerate_id(true);
        $_SESSION["student_id"] = (int)$student["id"];

        respond(["message" => "Login successful"]);
    }

    if ($action === "logout") {
        $_SESSION = [];
        session_destroy();
        respond(["message" => "Logged out"]);
    }

    if ($action === "me") {
        if (!isset($_SESSION["student_id"])) {
            respond(["student" => null]);
        }

        $stmt = $pdo->prepare(
            "SELECT id, name, email, skills FROM students WHERE id = ?"
        );
        $stmt->execute([$_SESSION["student_id"]]);
        respond(["student" => $stmt->fetch()]);
    }

    if ($action === "profile") {
        if (!isset($_SESSION["student_id"])) {
            respond(["error" => "Please log in"], 401);
        }

        $skills = trim($input["skills"] ?? "");

        if (strlen($skills) > 2000) {
            respond(["error" => "Skills input is too long"], 422);
        }

        $stmt = $pdo->prepare(
            "UPDATE students SET skills = ? WHERE id = ?"
        );
        $stmt->execute([$skills, $_SESSION["student_id"]]);

        respond(["message" => "Skills saved successfully"]);
    }

    if ($action === "jobs") {
        $stmt = $pdo->query(
            "SELECT id, title, company, description, required_skills
             FROM jobs ORDER BY id DESC"
        );
        respond(["jobs" => $stmt->fetchAll()]);
    }

    if ($action === "recommend") {
        if (!isset($_SESSION["student_id"])) {
            respond(["error" => "Please log in"], 401);
        }

        $stmt = $pdo->prepare(
            "SELECT skills FROM students WHERE id = ?"
        );
        $stmt->execute([$_SESSION["student_id"]]);
        $student = $stmt->fetch();

        $studentSkills = array_filter(array_map(
            fn($s) => strtolower(trim($s)),
            explode(",", $student["skills"] ?? "")
        ));

        $jobs = $pdo->query("SELECT * FROM jobs")->fetchAll();

        foreach ($jobs as &$job) {
            $required = array_filter(array_map(
                fn($s) => strtolower(trim($s)),
                explode(",", $job["required_skills"])
            ));

            $matched = array_values(array_intersect($required, $studentSkills));
            $missing = array_values(array_diff($required, $studentSkills));

            $job["matched_skills"] = $matched;
            $job["missing_skills"] = $missing;
            $job["match_percentage"] = count($required)
                ? (int)round(count($matched) / count($required) * 100)
                : 0;
        }
        unset($job);

        usort($jobs, fn($a, $b) =>
            $b["match_percentage"] <=> $a["match_percentage"]
        );

        respond(["recommendations" => $jobs]);
    }

    // ADMIN LOGIN
    if ($action === "admin_login") {
        $email = strtolower(trim($input["email"] ?? ""));
        $password = $input["password"] ?? "";

        $stmt = $pdo->prepare(
            "SELECT id, name, email, password
             FROM admins WHERE email = ?"
        );
        $stmt->execute([$email]);
        $admin = $stmt->fetch();

        if (!$admin || !password_verify($password, $admin["password"])) {
            respond(["error" => "Invalid admin email or password"], 401);
        }

        session_regenerate_id(true);
        $_SESSION["admin_id"] = (int)$admin["id"];

        respond([
            "message" => "Admin login successful",
            "admin" => [
                "id" => $admin["id"],
                "name" => $admin["name"],
                "email" => $admin["email"]
            ]
        ]);
    }

    // ADMIN DASHBOARD
    if ($action === "admin_dashboard") {
        if (!isset($_SESSION["admin_id"])) {
            respond(["error" => "Admin login required"], 401);
        }

        $students = (int)$pdo->query(
            "SELECT COUNT(*) FROM students"
        )->fetchColumn();

        $jobs = (int)$pdo->query(
            "SELECT COUNT(*) FROM jobs"
        )->fetchColumn();

        respond([
            "total_students" => $students,
            "total_jobs" => $jobs
        ]);
    }

    // ADMIN VIEW STUDENTS
    if ($action === "admin_students") {
        if (!isset($_SESSION["admin_id"])) {
            respond(["error" => "Admin login required"], 401);
        }

        $stmt = $pdo->query(
            "SELECT id, name, email, skills, created_at
             FROM students ORDER BY id DESC"
        );

        respond(["students" => $stmt->fetchAll()]);
    }

    // ADMIN ADD JOB
    if ($action === "admin_add_job") {
        if (!isset($_SESSION["admin_id"])) {
            respond(["error" => "Admin login required"], 401);
        }

        $title = trim($input["title"] ?? "");
        $company = trim($input["company"] ?? "");
        $description = trim($input["description"] ?? "");
        $requiredSkills = trim($input["required_skills"] ?? "");

        if ($title === "" || $company === "" || $requiredSkills === "") {
            respond([
                "error" => "Title, company and required skills are required"
            ], 422);
        }

        $stmt = $pdo->prepare(
            "INSERT INTO jobs (title, company, description, required_skills)
             VALUES (?, ?, ?, ?)"
        );

        $stmt->execute([
            $title,
            $company,
            $description,
            $requiredSkills
        ]);

        respond(["message" => "Job added successfully"]);
    }

    // ADMIN DELETE JOB
    if ($action === "admin_delete_job") {
        if (!isset($_SESSION["admin_id"])) {
            respond(["error" => "Admin login required"], 401);
        }

        $jobId = filter_var(
            $input["id"] ?? null,
            FILTER_VALIDATE_INT
        );

        if (!$jobId || $jobId < 1) {
            respond(["error" => "Valid job ID is required"], 422);
        }

        $stmt = $pdo->prepare("DELETE FROM jobs WHERE id = ?");
        $stmt->execute([$jobId]);

        if ($stmt->rowCount() === 0) {
            respond(["error" => "Job not found"], 404);
        }

        respond(["message" => "Job deleted successfully"]);
    }

    respond(["error" => "Unknown action"], 404);

} catch (PDOException $e) {
    if ($e->getCode() === "23000") {
        respond(["error" => "This email is already registered"], 409);
    }

    respond(["error" => "A database operation failed"], 500);
} catch (Throwable $e) {
    respond(["error" => "Server error"], 500);
}
?>
