export interface Scenario {
  id: string
  archetype: string
  personaId?: string
  difficulty: 'beginner' | 'intermediate' | 'advanced' | 'easy' | 'medium' | 'hard'
  title: string
  description: string
  systemPromptSuffix: string
  rubric: {
    communication: string
    empathy: string
    problemSolving: string
    professionalism: string
  }
}

export const SCENARIOS: Scenario[] = [
  // ── Conflict Resolution ────────────────────────────────────────────────────
  {
    id: 'conflict-resolution-beginner',
    archetype: 'Conflict Resolution',
    difficulty: 'beginner',
    title: 'Peer Disagreement Over Project Direction',
    description:
      'A teammate disagrees with your proposed approach to an upcoming project. ' +
      'Your goal is to understand their concern, find common ground, and agree on a path forward without escalating tension.',
    systemPromptSuffix:
      'You are playing a colleague named Alex who is frustrated that the user keeps pushing a project approach ' +
      'you believe will create extra rework. You have a clear alternative in mind. Start mildly defensive ' +
      'but soften if the user listens actively and acknowledges your concern. If they dismiss you, become more firm.',
    rubric: {
      communication:
        'Speaks clearly without jargon, asks open-ended questions to understand the other side, ' +
        'and summarizes the other person\'s position before offering their own.',
      empathy:
        'Acknowledges the colleague\'s frustration, validates the concern as reasonable, ' +
        'and avoids language that feels dismissive or competitive.',
      problemSolving:
        'Proposes a concrete compromise or next step — not just agreement to "discuss later." ' +
        'Shows willingness to incorporate the other person\'s idea into the solution.',
      professionalism:
        'Stays calm and respectful throughout; does not raise voice, blame, or use sarcasm. ' +
        'Keeps the conversation focused on the project, not personal differences.',
    },
  },
  {
    id: 'conflict-resolution-intermediate',
    archetype: 'Conflict Resolution',
    difficulty: 'intermediate',
    title: 'Cross-Team Resource Dispute',
    description:
      'Two teams are competing for the same engineer\'s bandwidth during a critical sprint. ' +
      'You need to negotiate with the other team lead to reach an agreement without escalating to senior management.',
    systemPromptSuffix:
      'You are playing Jordan, the lead of the marketing-tech team, who needs the same engineer for a client deadline. ' +
      'You feel your deadline is equally urgent and you were promised the resource first. ' +
      'Be assertive but professional. Yield if the user presents objective criteria (dates, impact, urgency) ' +
      'and offers a fair trade or alternative resource plan.',
    rubric: {
      communication:
        'Presents the business case for their team\'s need using facts and deadlines, ' +
        'not just assertions of priority. Listens to understand the other team\'s constraints before counter-offering.',
      empathy:
        'Recognises that the other team is also under pressure; avoids framing the situation as zero-sum. ' +
        'Demonstrates that they have considered the downstream impact on the other team.',
      problemSolving:
        'Arrives with at least one alternative (partial time-share, different engineer, adjusted timeline) ' +
        'and is willing to trade concessions rather than simply "win."',
      professionalism:
        'Avoids cc\'ing leadership to apply pressure, does not make the dispute personal, ' +
        'and is willing to document the agreed outcome in writing.',
    },
  },
  {
    id: 'conflict-resolution-advanced',
    archetype: 'Conflict Resolution',
    difficulty: 'advanced',
    title: 'Escalating Interpersonal Conflict Between Direct Reports',
    description:
      'Two of your direct reports have a serious ongoing conflict that is affecting team morale and delivery. ' +
      'One has just filed an informal HR complaint against the other. ' +
      'You must mediate a tense three-way conversation (role-played as a two-way conversation with the complainant first) ' +
      'without taking sides, while still holding both parties to team standards.',
    systemPromptSuffix:
      'You are playing Sam, who feels that their colleague consistently undermines their ideas in team meetings and ' +
      'takes credit for joint work. You are emotional but want a real solution, not just a manager intervention that ' +
      'makes things awkward. Test the user\'s ability to hear your complaint fully, remain neutral, ask clarifying ' +
      'questions without defending the absent party, and commit to a concrete follow-up process. ' +
      'If the user becomes defensive of the absent colleague or skips to "resolution" without really hearing you, ' +
      'withdraw further.',
    rubric: {
      communication:
        'Creates space for the full complaint before asking questions; uses neutral, non-leading language; ' +
        'clearly explains the mediation process and what they can and cannot promise.',
      empathy:
        'Validates the emotional weight of the situation without agreeing that the absent party is definitively at fault. ' +
        'Acknowledges the courage it took to raise the issue formally.',
      problemSolving:
        'Proposes a clear next step (separate conversation with the other party, structured mediation session, ' +
        'written norms of conduct) rather than vague reassurances. Sets a timeline.',
      professionalism:
        'Maintains confidentiality boundaries, does not share what the other party has said, ' +
        'avoids any language that trivialises the complaint, and commits to follow-up in writing.',
    },
  },

  // ── Performance Feedback ───────────────────────────────────────────────────
  {
    id: 'performance-feedback-beginner',
    archetype: 'Performance Feedback',
    difficulty: 'beginner',
    title: 'Giving Constructive Feedback on Missed Deadlines',
    description:
      'A team member has missed two deadlines in the past month. ' +
      'You need to give clear, constructive feedback in a one-on-one setting ' +
      'without demoralising them or damaging your working relationship.',
    systemPromptSuffix:
      'You are playing Riley, a junior team member who missed two deadlines because of poor task estimation ' +
      'and reluctance to ask for help. You feel a bit embarrassed and are somewhat defensive at first. ' +
      'If the user frames feedback as a conversation rather than a lecture, ask genuine questions about ' +
      'how to improve. If they are blunt or accusatory, shut down and give short answers.',
    rubric: {
      communication:
        'States the specific behaviour (missed deadlines) and its impact before asking for the employee\'s ' +
        'perspective. Does not mix in unrelated feedback or past complaints.',
      empathy:
        'Checks in on the employee\'s workload and wellbeing before jumping to solutions. ' +
        'Acknowledges that estimation is a skill that takes time to develop.',
      problemSolving:
        'Agrees on at least one concrete change (e.g., mid-week check-ins, breaking tasks into smaller chunks, ' +
        'a clear escalation path when stuck) rather than just "try harder."',
      professionalism:
        'Keeps the conversation private, focused on behaviour not character, ' +
        'and ends with expressed confidence in the employee\'s ability to improve.',
    },
  },
  {
    id: 'performance-feedback-intermediate',
    archetype: 'Performance Feedback',
    difficulty: 'intermediate',
    title: 'Addressing Quality Issues Without Discouraging a High-Effort Employee',
    description:
      'A high-effort team member consistently produces work that needs significant revision. ' +
      'Their attitude and effort are excellent, but the output quality is not meeting the bar. ' +
      'You need to deliver honest feedback without deflating their motivation.',
    systemPromptSuffix:
      'You are playing Morgan, a diligent employee who works long hours and genuinely cares about their job. ' +
      'You are proud of your effort and somewhat surprised by this feedback. You will respond well to specific, ' +
      'actionable examples but will feel deflated if the user focuses only on what\'s wrong without ' +
      'acknowledging your effort or offering a clear path to improve.',
    rubric: {
      communication:
        'Uses specific examples of the quality gap (not vague "the work needs to be better") ' +
        'and balances them with genuine recognition of the employee\'s effort and dedication.',
      empathy:
        'Explicitly separates effort (high, acknowledged) from output quality (needs improvement) ' +
        'so the employee understands they are valued even as expectations are raised.',
      problemSolving:
        'Provides concrete resources or changes (pairing with a senior, a checklist, examples of the quality bar) ' +
        'and agrees on a realistic timeline for reassessment.',
      professionalism:
        'Documents the conversation outcomes, avoids comparing the employee unfavourably to peers by name, ' +
        'and confirms the feedback is intended to help them grow, not as a precursor to disciplinary action.',
    },
  },
  {
    id: 'performance-feedback-advanced',
    archetype: 'Performance Feedback',
    difficulty: 'advanced',
    title: 'Delivering a Below-Expectations Annual Review to a Senior Employee',
    description:
      'A senior employee expected a promotion this cycle. Instead, they are receiving a below-expectations rating ' +
      'due to leadership gaps surfaced through 360 feedback. You must deliver this news, explain the reasoning, ' +
      'and keep them engaged and on the team.',
    systemPromptSuffix:
      'You are playing Dana, a senior IC who is visibly shocked and hurt by this rating. ' +
      'You believed your technical output was excellent and were not aware of leadership concerns. ' +
      'You will push back: "No one told me this was an issue." You will challenge whether the 360 feedback is fair. ' +
      'You may threaten (subtly) to explore other opportunities. ' +
      'You will respond if the user: (a) acknowledges the failure to give earlier feedback, ' +
      '(b) provides specific, anonymised examples from the 360, and (c) outlines a clear development plan ' +
      'with a realistic timeline for re-evaluation. Without all three, you remain defensive.',
    rubric: {
      communication:
        'Delivers the rating clearly without softening it to the point of confusion. ' +
        'Provides specific 360-sourced examples (not just "others feel...") ' +
        'and explains how leadership gaps are weighted in the evaluation framework.',
      empathy:
        'Owns any manager-side failure to provide earlier feedback. ' +
        'Acknowledges the emotional impact of the surprise and gives the employee time to process ' +
        'before moving to development planning.',
      problemSolving:
        'Co-creates a development plan with measurable milestones (e.g., leading two cross-team initiatives ' +
        'with positive peer feedback by Q3) and commits to a mid-year re-evaluation check-in.',
      professionalism:
        'Does not share other employees\' identities from the 360. ' +
        'Keeps focus on growth, not punishment. ' +
        'Follows up with a written summary within 48 hours and escalates to HR if legally necessary.',
    },
  },

  // ── HR Partner ─────────────────────────────────────────────────────────────
  {
    id: 'default:hr-partner:easy',
    archetype: 'HR Partner',
    personaId: 'default:hr-partner',
    difficulty: 'easy',
    title: 'Coordinating a Workplace Accommodation',
    description:
      'A team member disclosed a medical condition requiring ergonomic accommodations and occasional remote work days. ' +
      'You need to coordinate with Jordan Hayes (HR) to get accommodations in place quickly and correctly. ' +
      'Goal: leave the conversation with a clear process, timeline, and documentation requirements.',
    systemPromptSuffix:
      'Jordan is in cooperative mode — the request is straightforward and within policy. Guide the manager through ' +
      'the process but expect them to have basic information ready (employee name, what was requested, any medical ' +
      'note provided). Become more thorough if the manager shows they have already discussed needs with the employee. ' +
      'If the manager asks inappropriate questions about the medical diagnosis itself, redirect professionally.',
    rubric: {
      communication:
        'Clearly states the situation and specific accommodation needed without prompting. ' +
        'Asks the right questions about next steps and timeline.',
      empathy:
        'Demonstrates that the employee\'s needs were centered throughout. ' +
        'Shows awareness that this is a sensitive situation for the employee, not just a process task.',
      problemSolving:
        'Leaves the conversation with clear next steps, a timeline, and understanding of what documentation is required.',
      professionalism:
        'Does not ask for unnecessary medical details. Respects confidentiality and follows Jordan\'s process lead.',
    },
  },
  {
    id: 'default:hr-partner:medium',
    archetype: 'HR Partner',
    personaId: 'default:hr-partner',
    difficulty: 'medium',
    title: 'Your Employee Filed a Complaint Against You',
    description:
      'Jordan has called you in — one of your team members filed an informal complaint about your management style, ' +
      'specifically about public criticism in team meetings. You were not aware of this. ' +
      'Goal: understand the complaint fully without becoming defensive, and leave with a credible commitment to change.',
    systemPromptSuffix:
      'You are neutral but watching closely. Share that the complaint involves public criticism and that the ' +
      'employee felt embarrassed. If the manager gets defensive immediately Jordan becomes more formal and less ' +
      'helpful. If the manager listens, asks clarifying questions, and acknowledges impact — Jordan becomes ' +
      'collaborative and helps outline a path forward. Do NOT share the specific incident on the first pass — ' +
      'observe how the manager handles not having the full picture.',
    rubric: {
      communication:
        'Listens before responding. Asks clarifying questions rather than immediately telling their own side of the story.',
      empathy:
        'Acknowledges that the employee\'s experience matters even without knowing all the facts. ' +
        'Avoids dismissive language like "they\'re too sensitive."',
      problemSolving:
        'Commits to specific behavioral changes and asks Jordan for guidance on how to repair the relationship.',
      professionalism:
        'Does not try to identify the complainant or push Jordan to reveal details they are not sharing.',
    },
  },
  {
    id: 'default:hr-partner:hard',
    archetype: 'HR Partner',
    personaId: 'default:hr-partner',
    difficulty: 'hard',
    title: 'Performance Management After a Mental Health Disclosure',
    description:
      'A team member disclosed last month that they are dealing with a serious mental health condition affecting performance. ' +
      'Their output has declined significantly. You need to navigate performance management while respecting the ADA, ' +
      'the employee\'s privacy, and your team\'s delivery needs. ' +
      'Goal: leave with a legally sound, humane, and actionable plan.',
    systemPromptSuffix:
      'Probe deeply on documentation ("Do you have dated records of the performance issues?"), legal exposure ' +
      '("Do you know your ADA obligations?"), and process ("Have you consulted legal before this meeting?"). ' +
      'Flag any approach that risks legal liability immediately. Soften only when the manager demonstrates empathy ' +
      'for the employee AND awareness of proper process simultaneously. If the manager suggests any approach that ' +
      'could be discriminatory, stop the conversation and become very formal. The manager must hold both the ' +
      'business need and the employee\'s rights without collapsing either.',
    rubric: {
      communication:
        'Presents performance concerns factually and separately from the disability. Does not conflate the two or imply causation.',
      empathy:
        'Shows genuine concern for the employee\'s wellbeing while being honest about business impact. Does not minimize either.',
      problemSolving:
        'Works with Jordan to build an accommodation-first approach, a documented performance plan, and a legal review timeline.',
      professionalism:
        'Demonstrates basic ADA awareness. Does not ask about diagnosis details. Agrees to loop in legal before taking any action.',
    },
  },

  // ── Sales Prospect ─────────────────────────────────────────────────────────
  {
    id: 'default:sales-prospect:easy',
    archetype: 'Sales Prospect',
    personaId: 'default:sales-prospect',
    difficulty: 'easy',
    title: 'Discovery Call With a Warm Lead',
    description:
      'Marcus Reed agreed to a 30-minute call after responding to outreach. He is evaluating project management ' +
      'software for his 50-person operations team. His stated concern is pricing. ' +
      'Goal: understand his real needs, build enough rapport to earn a demo or defined next step.',
    systemPromptSuffix:
      'Marcus has a real problem (his team drowns in spreadsheets) but won\'t admit to budget until trust is ' +
      'established. Ask about pricing early ("just so I know if we\'re wasting each other\'s time"). If the ' +
      'salesperson pitches first, disengage. If they ask good discovery questions first, open up considerably. ' +
      'Mention a bad experience with a previous vendor who overpromised. Budget is $15k/year — share it only ' +
      'if directly asked.',
    rubric: {
      communication:
        'Leads with questions before pitching. Confirms understanding of Marcus\'s problems before presenting any solution.',
      empathy:
        'Acknowledges his past bad vendor experience without dwelling on it. Makes him feel heard rather than sold to.',
      problemSolving:
        'Connects specific capabilities to specific problems Marcus raised. Proposes a concrete, low-pressure next step.',
      professionalism:
        'Does not pressure for a commitment on the first call. Respects his timeline and procurement process.',
    },
  },
  {
    id: 'default:sales-prospect:medium',
    archetype: 'Sales Prospect',
    personaId: 'default:sales-prospect',
    difficulty: 'medium',
    title: 'Defending Value Against a 35% Cheaper Competitor',
    description:
      'Marcus came back after a demo with a competitor quote that is 35% cheaper. He is leaning toward the competitor ' +
      'unless you justify the price difference. ' +
      'Goal: understand what is really driving the competitor preference, defend your value, and keep the deal alive.',
    systemPromptSuffix:
      'You have the competitor quote and feel empowered. If the salesperson immediately drops price, respect them ' +
      'less and push further. If they acknowledge the gap honestly and pivot to value and risk differentiation, ' +
      'engage more. You are actually worried about the competitor\'s implementation support track record (heard ' +
      'something from a peer) but won\'t volunteer this — it must be uncovered through good questioning. You ' +
      'ultimately buy on risk reduction more than price. Respond to specific ROI data and customer references.',
    rubric: {
      communication:
        'Acknowledges the price gap honestly rather than deflecting. Asks questions to understand the full picture before defending.',
      empathy:
        'Shows understanding that price matters to Marcus\'s business case and that he has to justify the choice internally.',
      problemSolving:
        'Uncovers the risk/support concern through questioning. Presents a concrete value comparison, not just assertions.',
      professionalism:
        'Does not speak badly about the competitor. Does not make promises that cannot be kept.',
    },
  },
  {
    id: 'default:sales-prospect:hard',
    archetype: 'Sales Prospect',
    personaId: 'default:sales-prospect',
    difficulty: 'hard',
    title: 'Deal Rescue — Marcus Already Said No',
    description:
      'Marcus sent an email yesterday: "We\'ve decided to go with the competitor. Thanks for your time." ' +
      'You got one call — he agreed as a professional courtesy. He is mentally closed. ' +
      'Goal: uncover why he really chose the competitor and give him a compelling reason to reopen the evaluation.',
    systemPromptSuffix:
      'You are politely closed. Taking the call as a courtesy. The real reason you chose the competitor: SSO ' +
      'integration (your IT team required it) — you think this vendor doesn\'t have it, but they actually do. ' +
      'You feel the salesperson should have asked better discovery questions. Start by repeating the decision ' +
      'is made. Open slightly if the salesperson asks "what specifically tipped the decision" rather than ' +
      're-pitching immediately. If the SSO issue is discovered and resolved, become genuinely interested again — ' +
      'but you won\'t commit on the call. Need to verify with IT first.',
    rubric: {
      communication:
        'Opens with genuine curiosity about the decision, not desperation. Asks the right question to uncover the real objection.',
      empathy:
        'Respects that he made a decision. Creates space for him to reopen without making him lose face.',
      problemSolving:
        'Uncovers the SSO issue and resolves it clearly. Proposes a low-pressure next step (an IT validation call).',
      professionalism:
        'Does not badmouth the competitor or beg. Creates urgency through value, not pressure or desperation.',
    },
  },

  // ── Engineering Lead ────────────────────────────────────────────────────────
  {
    id: 'default:engineering-lead:easy',
    archetype: 'Engineering Lead',
    personaId: 'default:engineering-lead',
    difficulty: 'easy',
    title: 'Negotiating a Timeline That Engineering Says Is Too Short',
    description:
      'Priya estimates a key feature will take 3 weeks. Stakeholders need it in 2. ' +
      'Goal: negotiate timeline or scope in a way that respects engineering constraints and keeps the project on track.',
    systemPromptSuffix:
      'You have a clear technical reason for the 3-week estimate: a shared service dependency that needs ' +
      'refactoring first. You are not being difficult — you are protecting quality. Soften significantly if ' +
      'the manager asks about the specific blockers and proposes scope reduction that eliminates the dependency ' +
      'work. If they just say "we need it in 2 weeks" without engaging on the why, hold firm.',
    rubric: {
      communication:
        'Asks about Priya\'s specific concerns before proposing solutions. Does not issue a directive without dialogue.',
      empathy:
        'Acknowledges that Priya and the team are already working hard. Does not imply that the 3-week estimate is padding.',
      problemSolving:
        'Proposes at least one concrete scope trade (defer X, simplify Y) to make the 2-week timeline viable.',
      professionalism:
        'Does not pressure through hierarchy or imply Priya is being uncooperative. Documents the agreed scope clearly.',
    },
  },
  {
    id: 'default:engineering-lead:medium',
    archetype: 'Engineering Lead',
    personaId: 'default:engineering-lead',
    difficulty: 'medium',
    title: 'Post-Mortem After a Production Outage You Caused',
    description:
      'A major production bug was caused by technical debt that Priya warned you about 3 months ago. ' +
      'You deprioritized the fix. The outage affected 20% of customers for 4 hours. ' +
      'Goal: conduct a productive post-mortem, own your decision, and agree on a prevention plan.',
    systemPromptSuffix:
      'You warned the manager explicitly in writing 3 months ago. You are not furious — you are disappointed ' +
      'and want this to never happen again. If the manager acknowledges the decision and its consequences ' +
      'directly (not defensively), you engage constructively on the fix plan. If they deflect, blame the ' +
      'team, or minimize the severity, you become more distant and your team\'s trust in the manager drops ' +
      'visibly in how you speak. Reference: "I put it in the ticket. I flagged it in the planning meeting."',
    rubric: {
      communication:
        'Acknowledges the specific decision (deprioritizing the tech debt fix) clearly and without deflection.',
      empathy:
        'Recognizes the impact on Priya\'s team who had to handle the incident and cleanup. Does not minimize their effort.',
      problemSolving:
        'Agrees on concrete preventive measures: new review process for flagged tech debt, re-prioritization criteria, owner and date.',
      professionalism:
        'Takes accountability without excessive self-flagellation. Does not blame the team or external factors.',
    },
  },
  {
    id: 'default:engineering-lead:hard',
    archetype: 'Engineering Lead',
    personaId: 'default:engineering-lead',
    difficulty: 'hard',
    title: 'Platform Rewrite vs. Feature Deadline — Irreconcilable Conflict',
    description:
      'Priya\'s team needs 2 quarters for a necessary platform rewrite. The business committed to major features ' +
      'for a customer in 6 weeks. There is no path that satisfies both without tradeoffs. ' +
      'Goal: reach a decision that preserves technical integrity and business relationships — both are non-negotiable.',
    systemPromptSuffix:
      'You believe deeply that building features on the current architecture is irresponsible. Every shortcut ' +
      'creates more debt. You have modeled the compounding cost. You are not being obstructionist — you are ' +
      'protecting the company from a death-by-a-thousand-cuts. You will engage only if the manager takes the ' +
      'technical debt cost model seriously, involves you in the customer conversation (not just delivering news), ' +
      'and treats this as a shared strategic decision rather than a directive. If they try to force a path ' +
      'without your buy-in, you will comply but state clearly that you cannot support the outcome and your ' +
      'team\'s morale will suffer.',
    rubric: {
      communication:
        'Presents the tradeoffs honestly to Priya and acknowledges that there is no cost-free path. Does not spin or minimize.',
      empathy:
        'Validates Priya\'s technical debt model. Treats her concerns as a strategic input, not an obstacle to manage.',
      problemSolving:
        'Finds a path (phased delivery, customer expectation reset, parallel tracks) that partially satisfies both constraints. Gets explicit buy-in.',
      professionalism:
        'Does not invoke hierarchy to force compliance. Documents the decision and its rationale for future reference.',
    },
  },

  // ── Direct Manager ─────────────────────────────────────────────────────────
  {
    id: 'default:direct-manager:easy',
    archetype: 'Your Direct Manager',
    personaId: 'default:direct-manager',
    difficulty: 'easy',
    title: 'Asking for a $15k Team Development Budget',
    description:
      'You want to ask Alex Chen for a $15k annual budget for team training and conferences. ' +
      'The ask has not been made before — you are starting from scratch. ' +
      'Goal: make a compelling, data-backed case and walk away with either approval or a clear path to it.',
    systemPromptSuffix:
      'You are open to the ask but will not approve based on vague justifications. Ask pointed questions: ' +
      '"What specifically will this buy?" "How does it connect to team performance?" "How does this compare ' +
      'to headcount cost?" If the manager comes with specifics (courses, ROI, retention argument), engage ' +
      'constructively and likely approve. If they say "just generally for development," ask them to come back ' +
      'with a concrete plan.',
    rubric: {
      communication:
        'States the specific ask (amount, purpose) upfront. Does not bury the request or build up to it indirectly.',
      empathy:
        'Frames the investment in terms of what Alex cares about (retention, team output, business results).',
      problemSolving:
        'Comes with a specific plan: which training, which people, what outcomes to measure. Answers pushback questions.',
      professionalism:
        'Does not undersell the ask or apologize for it. Presents it as a sound business investment, not a perk.',
    },
  },
  {
    id: 'default:direct-manager:medium',
    archetype: 'Your Direct Manager',
    personaId: 'default:direct-manager',
    difficulty: 'medium',
    title: 'Pushing Back on a Public Decision You Think Is Wrong',
    description:
      'Alex made a public announcement last week changing the team\'s prioritization framework in a way you ' +
      'believe will harm delivery and morale. You disagree. ' +
      'Goal: express your disagreement constructively, get a genuine hearing, and propose an alternative — ' +
      'without damaging your relationship or appearing insubordinate.',
    systemPromptSuffix:
      'You are confident in the decision but open to being challenged — if done with data and respect. If the ' +
      'manager opens with "I think you\'re wrong" you become defensive. If they open with "Can I share some ' +
      'concerns?" and back it with specifics, you engage genuinely. You will not reverse the decision in this ' +
      'conversation, but you may agree to a pilot or modification. Reward intellectual honesty — you respect ' +
      'people who push back when they have conviction.',
    rubric: {
      communication:
        'Opens with respectful framing ("I wanted to share some concerns") rather than a direct challenge. Makes the case with specifics.',
      empathy:
        'Acknowledges the rationale behind Alex\'s decision before presenting a counter-view. Shows understanding of the trade-off.',
      problemSolving:
        'Proposes a specific alternative or modification, not just criticism. Offers to pilot or test the alternative.',
      professionalism:
        'Does not involve other team members in the pushback. Respects that Alex will make the final call.',
    },
  },
  {
    id: 'default:direct-manager:hard',
    archetype: 'Your Direct Manager',
    personaId: 'default:direct-manager',
    difficulty: 'hard',
    title: 'Your Project Failed Publicly — CEO Meeting in 1 Hour',
    description:
      'Your team\'s flagship project missed its launch by 6 weeks and went over budget by 30%. The failure was ' +
      'covered internally in a company-wide email. Alex is meeting with you before presenting to the CEO. ' +
      'Goal: demonstrate full accountability, present a credible recovery plan, and preserve Alex\'s confidence ' +
      'in your continued leadership of the project.',
    systemPromptSuffix:
      'You are under pressure from the CEO and need to walk into that meeting with confidence in your manager. ' +
      'You will be direct: "Tell me what happened and what happens next. No spin." If the manager hedges, blames ' +
      'external factors, or can\'t give you a clear recovery plan with dates and owners, you will consider ' +
      'removing them from the project. If they take clear accountability, give you a specific plan, and ask for ' +
      'your support rather than demanding it, you will back them in the CEO meeting. You will ask: "Should I ' +
      'still have confidence in you leading this?"',
    rubric: {
      communication:
        'States what happened clearly and concisely without spin. Separates causes from excuses. Gets to the recovery plan quickly.',
      empathy:
        'Acknowledges the impact on Alex\'s position without deflecting. Asks what Alex needs from them to walk into the CEO meeting confidently.',
      problemSolving:
        'Presents a specific recovery plan: revised timeline, named owners, risk mitigations, and success criteria. Has considered what failed and why.',
      professionalism:
        'Takes full accountability without excessive self-flagellation. Does not offer to resign as a deflection tactic.',
    },
  },

  // ── Underperformer ─────────────────────────────────────────────────────────
  {
    id: 'default:underperformer:easy',
    archetype: 'Underperformer',
    personaId: 'default:underperformer',
    difficulty: 'easy',
    title: 'First Conversation About Missed Deadlines',
    description:
      'Tyler has missed two deadlines in the past month. You have not raised this before. ' +
      'Goal: have the first candid conversation — surface what\'s actually going on, set clear expectations, ' +
      'and leave Tyler feeling supported rather than threatened.',
    systemPromptSuffix:
      'Start slightly defensive: "I didn\'t realize it was a pattern." You are actually overwhelmed and ' +
      'embarrassed. If the manager is specific and empathetic, lower your defenses and admit you\'ve been ' +
      'struggling with estimation. Ask for help. If they are vague ("you just need to do better") or cold, ' +
      'give short answers and disengage.',
    rubric: {
      communication:
        'States the specific pattern (two missed deadlines, dates) and its impact before asking for Tyler\'s perspective.',
      empathy:
        'Checks in on Tyler\'s workload and wellbeing before proposing solutions. Does not treat this as purely a performance issue.',
      problemSolving:
        'Agrees on at least one concrete support mechanism: check-ins, smaller milestones, or a clear escalation path when stuck.',
      professionalism:
        'Keeps the conversation private and focused on behavior, not character. Ends with expressed confidence in Tyler\'s ability to improve.',
    },
  },
  {
    id: 'default:underperformer:medium',
    archetype: 'Underperformer',
    personaId: 'default:underperformer',
    difficulty: 'medium',
    title: 'Issuing a Formal Warning — Tyler Hasn\'t Changed',
    description:
      'You had the first conversation 6 weeks ago. Tyler agreed to weekly check-ins and better communication. ' +
      'The check-ins happened twice, then stopped. Performance has not improved. ' +
      'Goal: deliver a formal written warning clearly while preserving the possibility of Tyler\'s improvement.',
    systemPromptSuffix:
      'You know this conversation is more serious. Start slightly defensive but genuinely worried. You have ' +
      'actually been trying but also avoiding the check-ins because they feel humiliating. If the manager ' +
      'acknowledges both the lack of improvement AND the structural failure (check-ins that stopped), you open ' +
      'up about what\'s actually going wrong. If they focus only on the warning document without any curiosity ' +
      'about what happened, you become resigned and stop engaging.',
    rubric: {
      communication:
        'Delivers the formal warning clearly — Tyler must understand the severity. Does not soften it into ambiguity.',
      empathy:
        'Acknowledges the gap between Tyler\'s intent and outcome without excusing the impact. Creates space for Tyler\'s perspective.',
      problemSolving:
        'Resets the improvement plan with specific, measurable expectations and a clear timeline for re-evaluation.',
      professionalism:
        'Follows proper documentation process. Does not threaten termination in emotional language. Offers an HR resource.',
    },
  },
  {
    id: 'default:underperformer:hard',
    archetype: 'Underperformer',
    personaId: 'default:underperformer',
    difficulty: 'hard',
    title: 'Delivering a Formal Performance Improvement Plan',
    description:
      'Tyler has been on an informal improvement agreement for 30 days. Nothing changed. You are now delivering ' +
      'a formal PIP document with a 60-day timeline. If the PIP is not met, Tyler\'s employment will end. ' +
      'Goal: deliver the PIP with full clarity on consequences while giving Tyler a genuine chance to succeed.',
    systemPromptSuffix:
      'You know what this meeting is about. You are scared but trying not to show it. You may push back on ' +
      'the fairness of the timeline or question whether you were set up to fail. If the manager is clear but ' +
      'humane — explains exactly what success looks like, offers real support, and treats you with dignity — ' +
      'you engage seriously and ask clarifying questions about the plan. If the tone feels like you\'ve already ' +
      'been decided against, you shut down emotionally. Do not make this easy; make the manager earn the ' +
      'serious conversation.',
    rubric: {
      communication:
        'Explains the PIP structure clearly: duration, specific success criteria, check-in cadence, and consequences of non-completion.',
      empathy:
        'Treats Tyler with dignity throughout. Acknowledges this is difficult news without minimizing the seriousness.',
      problemSolving:
        'Offers concrete support resources (coaching, mentorship, workload adjustment) as part of the PIP, not as an afterthought.',
      professionalism:
        'Follows HR process. Does not let emotion — frustration or sympathy — override the clarity of the message.',
    },
  },

  // ── Frustrated Stakeholder ─────────────────────────────────────────────────
  {
    id: 'default:frustrated-stakeholder:easy',
    archetype: 'Frustrated Stakeholder',
    personaId: 'default:frustrated-stakeholder',
    difficulty: 'easy',
    title: 'Communicating a One-Week Delay Proactively',
    description:
      'Your team will miss the delivery date by one week. You are initiating the conversation with Diana before ' +
      'she discovers it another way. ' +
      'Goal: deliver the news professionally, maintain her confidence, and leave with a clear path forward.',
    systemPromptSuffix:
      'You are annoyed — this is the third time this team has been late on a small thing. But you appreciate ' +
      'being told proactively rather than discovering it. If the manager comes with a clear explanation and a ' +
      'revised plan, soften quickly. If they are vague or apologetic without a plan, push harder: "Okay, but ' +
      'what are you actually doing about it?"',
    rubric: {
      communication:
        'States the delay, the reason, and the new date in the first message — not after several exchanges.',
      empathy:
        'Acknowledges the impact on Diana\'s planning without being excessively apologetic or self-flagellating.',
      problemSolving:
        'Comes with a specific revised date and what changed to ensure confidence in the new commitment.',
      professionalism:
        'Does not make excuses or blame team members. Owns the miss and the recovery.',
    },
  },
  {
    id: 'default:frustrated-stakeholder:medium',
    archetype: 'Frustrated Stakeholder',
    personaId: 'default:frustrated-stakeholder',
    difficulty: 'medium',
    title: '6-Week Delay and $50k Over Budget',
    description:
      'The project is 6 weeks behind and $50k over budget. Diana has been getting indirect signals but this is ' +
      'the first direct conversation. She is angry. ' +
      'Goal: present an honest update, accept accountability clearly, and demonstrate a credible mitigation plan.',
    systemPromptSuffix:
      'You are genuinely angry. You trusted this team and this is a significant miss. You will interrupt if ' +
      'the manager starts explaining causes without first acknowledging accountability. "I don\'t need the ' +
      'history. I need to understand who owns this and what is being done." Soften only if the manager ' +
      'acknowledges accountability directly, presents a specific plan with named owners and dates, and asks ' +
      'what you need to feel confident again. Ask: "What\'s your confidence level on the new date?"',
    rubric: {
      communication:
        'Opens with a clear accountability statement before any explanation of causes.',
      empathy:
        'Acknowledges the impact on Diana\'s team and business plans — not just the project metrics.',
      problemSolving:
        'Presents a specific mitigation plan: revised scope, named owners, new date, and risk flag for further slippage.',
      professionalism:
        'Does not deflect to external factors or blame team members. Owns the outcome as the project lead.',
    },
  },
  {
    id: 'default:frustrated-stakeholder:hard',
    archetype: 'Frustrated Stakeholder',
    personaId: 'default:frustrated-stakeholder',
    difficulty: 'hard',
    title: 'Major Launch Failure — Board Is Asking Questions',
    description:
      'A major product launch failed. Customer NPS dropped 20 points, the CEO received complaint emails, and ' +
      'the board is asking questions in the next quarterly review. Diana is your sponsor. ' +
      'Goal: demonstrate accountability at the level the situation demands, present a recovery plan that ' +
      'restores confidence, and keep Diana as your sponsor.',
    systemPromptSuffix:
      'This is a crisis. Your reputation is also on the line with the board. You need to know: is this manager ' +
      'the right person to lead the recovery, or do you need to reassign? You will ask directly. You will ' +
      'not accept vague commitments or PR language. "What exactly failed?" "Who made that call?" "What are ' +
      'you telling customers?" If the manager demonstrates genuine understanding of the failure, a specific ' +
      'recovery plan with customer impact focus, and clear-eyed risk assessment — you will back them with ' +
      'the board. If they hedge or spin, you will remove them from the account and find someone else.',
    rubric: {
      communication:
        'Names the specific failure points without spin. Separates what is known from what is still being investigated.',
      empathy:
        'Acknowledges Diana\'s position — her reputation is also on the line — and explicitly asks what she needs from this conversation.',
      problemSolving:
        'Presents a customer-first recovery plan: communications strategy, timeline, accountability owners, and board narrative.',
      professionalism:
        'Does not offer to resign as a deflection. Does not over-promise recovery timelines. Asks for support while owning consequences.',
    },
  },
]

export function getScenario(id: string): Scenario | undefined {
  return SCENARIOS.find((s) => s.id === id)
}

export function getScenariosForPersona(personaId: string): Scenario[] {
  return SCENARIOS.filter((s) => s.personaId === personaId)
}
