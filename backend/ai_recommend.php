
<?php

header("Access-Control-Allow-Origin: http://localhost:5173");
header("Access-Control-Allow-Credentials: true");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json; charset=UTF-8");

if ($_SERVER["REQUEST_METHOD"] === "OPTIONS") {
    http_response_code(204);
    exit;
}

session_start();

header("Content-Type: application/json; charset=UTF-8");

function sendJson($status, $data)
{
    http_response_code($status);
    echo json_encode($data);
    exit;
}

// Keep the same session key used by your existing login system.
if (!isset($_SESSION["student_id"])) {
    sendJson(401, [
        "error" => "Please login first."
    ]);
}

$input = json_decode(file_get_contents("php://input"), true);

if (!is_array($input)) {
    $input = [];
}

$skills = trim($input["skills"] ?? "");
$interests = trim($input["interests"] ?? "");
$targetCareer = trim($input["targetCareer"] ?? "");

if ($skills === "") {
    sendJson(400, [
        "error" => "Please enter your skills."
    ]);
}

// Convert text into lowercase keywords.
$allText = strtolower($skills . " " . $interests . " " . $targetCareer);

$roles = [
    "Frontend Developer" => [
        "keywords" => ["html", "css", "javascript", "react", "frontend", "ui"],
        "learn" => "HTML, CSS, JavaScript, React, responsive design",
        "project" => "Build a responsive portfolio website"
    ],
    "PHP Web Developer" => [
        "keywords" => ["php", "mysql", "sql", "backend", "web", "xampp"],
        "learn" => "PHP, MySQL, CRUD, sessions, form validation",
        "project" => "Build a student management system"
    ],
    "Full Stack Developer" => [
        "keywords" => ["react", "php", "mysql", "javascript", "full stack", "fullstack"],
        "learn" => "Frontend, backend, database integration, REST APIs",
        "project" => "Build a complete job recommendation website"
    ],
    "Python Developer" => [
        "keywords" => ["python", "django", "flask", "automation"],
        "learn" => "Python fundamentals, functions, OOP, APIs",
        "project" => "Build a task management application"
    ],
    "Data Analyst" => [
        "keywords" => ["python", "excel", "sql", "data", "statistics"],
        "learn" => "Excel, SQL, Python, data visualization",
        "project" => "Analyze and visualize student placement data"
    ]
];

$scores = [];

foreach ($roles as $role => $details) {
    $score = 0;

    foreach ($details["keywords"] as $keyword) {
        if (strpos($allText, $keyword) !== false) {
            $score++;
        }
    }

    $scores[$role] = $score;
}

arsort($scores);

$recommendation = "SKILLBRIDGE AI - CAREER REPORT\n\n";
$recommendation .= "Your skills: " . $skills . "\n";
$recommendation .= "Your interests: " . ($interests ?: "Not provided") . "\n";
$recommendation .= "Target career: " . ($targetCareer ?: "Explore suitable careers") . "\n\n";

$recommendation .= "1. RECOMMENDED CAREER ROLES\n";

$count = 0;

foreach ($scores as $role => $score) {
    if ($count >= 3) {
        break;
    }

    $recommendation .= ($count + 1) . ". " . $role . "\n";
    $recommendation .= "   Skill match: " .
        ($score > 0 ? "Relevant keywords found" : "Explore this career") . "\n";
    $count++;
}

$recommendation .= "\n2. SKILLS TO IMPROVE\n";
$recommendation .= "Learn the skills listed in the roadmap for your preferred career. ";
$recommendation .= "Practice programming, problem-solving, databases and Git.\n\n";

$recommendation .= "3. FOUR-WEEK LEARNING ROADMAP\n";
$recommendation .= "Week 1: Revise programming fundamentals and identify skill gaps.\n";
$recommendation .= "Week 2: Learn the main technologies for your chosen career.\n";
$recommendation .= "Week 3: Build a small practical project.\n";
$recommendation .= "Week 4: Complete the project, test it and upload it to GitHub.\n\n";

$recommendation .= "4. PORTFOLIO PROJECT IDEAS\n";

$shown = 0;

foreach ($scores as $role => $score) {
    if ($shown >= 2) {
        break;
    }

    $recommendation .= "- " . $roles[$role]["project"] . "\n";
    $shown++;
}

$recommendation .= "\n5. NEXT STEP\n";
$recommendation .= "Choose one career, follow its learning roadmap and build projects to demonstrate your skills.\n\n";
$recommendation .= "Note: These are rule-based suggestions generated from keywords, not live AI-generated advice.";

sendJson(200, [
    "success" => true,
    "recommendation" => $recommendation,
    "result" => $recommendation
]);
