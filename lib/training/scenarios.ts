export interface Scenario {
  id: string
  archetype: string
  difficulty: 'beginner' | 'intermediate' | 'advanced'
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
]

export function getScenario(id: string): Scenario | undefined {
  return SCENARIOS.find((s) => s.id === id)
}
