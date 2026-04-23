$questionnaireId = "4ea42253-f464-433c-8676-39d04dd1360f"
$baseUrl = "http://localhost:3001/api/questionnaires"

$firstNames = @("Alex", "Jordan", "Taylor", "Morgan", "Casey", "Riley", "Quinn", "Avery", "Blake", "Cameron", "Drew", "Finley", "Harper", "Jamie", "Kelly", "Logan", "Mason", "Noah", "Parker", "Reese", "Sam", "Sydney", "Terry", "Val", "Whitney", "Adrian", "Bailey", "Charlie", "Dana", "Ellis", "Frankie", "Glen", "Hayden", "Ira", "Jesse", "Kerry", "Lee", "Mel", "Noel", "Pat")
$roles = @("Engineer", "Manager", "Analyst", "Designer", "Developer", "Consultant", "Director", "Coordinator", "Specialist", "Lead")
$depts = @("Engineering", "Product", "Marketing", "Sales", "Operations", "HR", "Finance", "Legal", "IT", "Research")

$successCount = 0
$errorCount = 0

for ($i = 1; $i -le 40; $i++) {
    # Generate varied answers - different patterns for diversity
    $pattern = $i % 10
    
    switch ($pattern) {
        0 { $base = @{A1=5;A2=1;A3=2;A4=4;A5=4;A6=2;A7=3;A8=4;B1=4;B2=2;B3=2;B4=4;B5=1;B6=5;B7=3;B8=4;C1=2;C2=5;C3=1;C4=5;C5=1;C6=4;D1=3;D2=2;D3=3;D4=4;D5=4;D6=2} } # Innovator
        1 { $base = @{A1=1;A2=5;A3=5;A4=1;A5=3;A6=4;A7=4;A8=2;B1=2;B2=4;B3=4;B4=2;B5=5;B6=1;B7=2;B8=4;C1=5;C2=1;C3=4;C4=2;C5=3;C6=1;D1=2;D2=4;D3=5;D4=1;D5=4;D6=2} } # Traditionalist
        2 { $base = @{A1=4;A2=2;A3=4;A4=2;A5=5;A6=1;A7=3;A8=4;B1=5;B2=2;B3=3;B4=4;B5=4;B6=2;B7=4;B8=3;C1=2;C2=5;C3=1;C4=5;C5=2;C6=3;D1=4;D2=2;D3=4;D4=3;D5=5;D6=1} } # Leader
        3 { $base = @{A1=3;A2=3;A3=3;A4=3;A5=5;A6=1;A7=5;A8=1;B1=2;B2=5;B3=4;B4=2;B5=3;B6=3;B7=2;B8=5;C1=4;C2=2;C3=3;C4=3;C5=4;C6=1;D1=1;D2=5;D3=3;D4=3;D5=3;D6=3} } # TeamPlayer
        4 { $base = @{A1=2;A2=4;A3=5;A4=1;A5=2;A6=5;A7=2;A8=3;B1=3;B2=3;B3=2;B4=5;B5=4;B6=2;B7=4;B8=3;C1=3;C2=4;C3=2;C4=4;C5=1;C6=3;D1=2;D2=3;D3=5;D4=1;D5=5;D6=2} } # Analyst
        5 { $base = @{A1=5;A2=1;A3=2;A4=3;A5=4;A6=3;A7=3;A8=3;B1=3;B2=3;B3=5;B4=1;B5=1;B6=5;B7=2;B8=5;C1=2;C2=4;C3=1;C4=4;C5=2;C6=3;D1=2;D2=3;D3=2;D4=5;D5=3;D6=3} } # Creative
        6 { $base = @{A1=3;A2=3;A3=4;A4=2;A5=4;A6=2;A7=2;A8=4;B1=5;B2=1;B3=2;B4=5;B5=5;B6=1;B7=5;B8=2;C1=2;C2=4;C3=1;C4=5;C5=3;C6=2;D1=5;D2=1;D3=5;D4=2;D5=5;D6=1} } # Executive
        7 { $base = @{A1=2;A2=4;A3=3;A4=3;A5=4;A6=2;A7=5;A8=1;B1=1;B2=5;B3=4;B4=2;B5=2;B6=4;B7=1;B8=5;C1=5;C2=1;C3=4;C4=2;C5=4;C6=1;D1=1;D2=5;D3=2;D4=4;D5=2;D6=4} } # Supporter
        8 { $base = @{A1=5;A2=1;A3=2;A4=5;A5=3;A6=3;A7=1;A8=5;B1=5;B2=1;B3=1;B4=5;B5=1;B6=5;B7=3;B8=4;C1=1;C2=5;C3=1;C4=5;C5=1;C6=5;D1=5;D2=1;D3=2;D4=5;D5=4;D6=2} } # Maverick
        9 { $base = @{A1=3;A2=3;A3=3;A4=3;A5=4;A6=2;A7=5;A8=1;B1=2;B2=4;B3=3;B4=3;B5=3;B6=3;B7=2;B8=5;C1=3;C2=3;C3=2;C4=4;C5=3;C6=2;D1=1;D2=5;D3=3;D4=3;D5=4;D6=2} } # Mediator
    }
    
    # Add random variation
    $answers = @{}
    foreach ($key in $base.Keys) {
        $val = $base[$key] + (Get-Random -Minimum -1 -Maximum 2)
        $answers[$key] = [Math]::Max(1, [Math]::Min(5, $val))
    }
    
    $name = $firstNames[$i - 1]
    $role = $roles[$i % $roles.Count]
    $dept = $depts[$i % $depts.Count]
    
    $body = @{
        answers = $answers
        demographics = @{
            name = "$name Smith"
            email = "$($name.ToLower())$i@company.com"
            role = $role
            department = $dept
        }
    } | ConvertTo-Json -Depth 3 -Compress
    
    try {
        $null = Invoke-RestMethod -Uri "$baseUrl/$questionnaireId/responses" -Method POST -Body $body -ContentType "application/json"
        $successCount++
        Write-Host "[$i/40] OK - $name ($role, $dept)" -ForegroundColor Green
    } catch {
        $errorCount++
        Write-Host "[$i/40] ERROR: $($_.Exception.Message)" -ForegroundColor Red
    }
    
    Start-Sleep -Milliseconds 100
}

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "DONE! Success: $successCount, Errors: $errorCount" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
