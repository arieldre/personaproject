$questionnaireId = "1ce3de4b-d393-4c1d-b956-5f1fca003555"
$uri = "http://localhost:3001/api/questionnaires/$questionnaireId/responses"

# 5 distinct persona types, each submitted 5 times = 25 responses
$personas = @(
    @{type="Direct Leader"; comm="Direct and to the point"; feedback="Immediately and directly"; conflict="Address them head-on immediately"; decision="Trust my gut instinct"; motivation=@("Making an impact","Autonomy and independence"); stress="I thrive under pressure"; meeting="Quick stand-ups"; values=@("Efficiency","Speed"); learning="Hands-on experimentation"; change="I embrace change enthusiastically"; pain=@("Micromanagement","Too many meetings"); team="Leader who drives direction"; success="Delivering results and leading teams to victory"; topics=@("Company strategy","Technical/work details")},
    
    @{type="Analytical Thinker"; comm="Detailed and thorough"; feedback="Written, so I can process it"; conflict="Take time to cool down first"; decision="Analyze all available data"; motivation=@("Learning new skills","Making an impact"); stress="I stay calm but prefer less stress"; meeting="Structured with clear agenda"; values=@("Quality","Transparency"); learning="Reading documentation"; change="I am cautiously optimistic"; pain=@("Lack of clear direction","Poor communication"); team="Contributor who executes"; success="Solving complex problems with elegant solutions"; topics=@("Technical/work details","Industry trends")},
    
    @{type="Team Collaborator"; comm="Casual and friendly"; feedback="In private, with context"; conflict="Seek mediation from others"; decision="Consult with others first"; motivation=@("Team collaboration","Work-life balance"); stress="I need time to decompress"; meeting="Open discussion format"; values=@("Collaboration","Transparency"); learning="One-on-one mentoring"; change="I need time to adapt"; pain=@("Poor communication","Lack of recognition"); team="Supporter who helps others"; success="Helping teammates grow and succeed together"; topics=@("Team dynamics","Personal interests")},
    
    @{type="Creative Innovator"; comm="Casual and friendly"; feedback="In private, with context"; conflict="Take time to cool down first"; decision="Trust my gut instinct"; motivation=@("Learning new skills","Autonomy and independence"); stress="I thrive under pressure"; meeting="Open discussion format"; values=@("Innovation","Creativity"); learning="Hands-on experimentation"; change="I embrace change enthusiastically"; pain=@("Inefficient processes","Limited growth opportunities"); team="Innovator who generates ideas"; success="Creating breakthrough solutions that change the game"; topics=@("Industry trends","Company strategy")},
    
    @{type="Process Organizer"; comm="Formal and professional"; feedback="Through regular scheduled reviews"; conflict="Avoid confrontation if possible"; decision="Follow established procedures"; motivation=@("Work-life balance","Financial rewards"); stress="I prefer to avoid high-pressure situations"; meeting="Structured with clear agenda"; values=@("Stability","Efficiency"); learning="Reading documentation"; change="I prefer stability"; pain=@("Unclear expectations","Lack of clear direction"); team="Coordinator who organizes"; success="Maintaining smooth and reliable operations"; topics=@("Technical/work details","Team dynamics")}
)

Write-Host "Submitting 25 responses to questionnaire..." -ForegroundColor Cyan
$count = 0

foreach ($p in $personas) {
    for ($i = 1; $i -le 5; $i++) {
        $count++
        $body = @{
            respondentEmail = "testuser$count@example.com"
            respondentName = "$($p.type) $i"
            answers = @{
                comm_style = $p.comm
                feedback_pref = $p.feedback
                conflict_approach = $p.conflict
                decision_making = $p.decision
                work_motivation = $p.motivation
                stress_response = $p.stress
                meeting_pref = $p.meeting
                work_values = $p.values
                learning_style = $p.learning
                change_attitude = $p.change
                pain_points = $p.pain
                team_role = $p.team
                success_definition = $p.success
                ideal_workday = "A balanced day with focused work time and team collaboration"
                communication_topics = $p.topics
            }
        } | ConvertTo-Json -Depth 3
        
        try {
            $response = Invoke-RestMethod -Uri $uri -Method POST -ContentType "application/json" -Body $body
            Write-Host "[$count/25] OK - $($p.type) $i" -ForegroundColor Green
        } catch {
            Write-Host "[$count/25] FAIL - $($p.type) $i : $($_.Exception.Message)" -ForegroundColor Red
        }
        
        Start-Sleep -Seconds 3
    }
}

Write-Host "`nDone! Submitted $count responses." -ForegroundColor Cyan
