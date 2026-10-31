import original from './original.json' with { type: 'json' };

export const GRATITUDE = original.GRATITUDE;
export const AFFIRMATIONS = original.AFFIRMATIONS;
export const CALM_STEPS = original.CALM_STEPS;
export const NIGHT_STEPS = original.NIGHT_STEPS;
export const EMOTIONS = original.EMOTIONS;
export const RESPONSES = original.RESP;
export const CRISIS_STEPS = original.CRISIS_DATA;

export const JOURNAL_PROMPTS = [
  ...original.JPROMPTS,
  'Where did I feel most like myself today?',
  'What can I set down before sleep?',
];

export const LEARN = [
  ...original.LEARN_DATA,
  {
    id: 5,
    e: '🌙',
    t: 'Rest Is Not a Reward',
    m: '3 min',
    c: [
      'A lot of us treat rest like something we unlock after the day has been impressive enough.',
      'That bargain is exhausting, and it is not honest. Bodies and minds repair on a schedule that does not check your to-do list.',
      'Scripture’s oldest rhythm is work and rest side by side. Rest was never the prize for finishing. It was part of being human.',
      'When you lie down with unfinished things, you are not failing the day. You are letting the day be the size it actually was.',
      'Try a smaller permission: ten minutes where nothing is being optimized. Not a hack. A chair. A breath. A closed laptop.',
      'You can thank God for rest without earning it first. The thank-you is allowed to come before the proof.',
    ],
  },
  {
    id: 6,
    e: '🌿',
    t: 'When You Cannot Feel Grateful',
    m: '3 min',
    c: [
      'Some days gratitude sounds like a demand to feel better than you do.',
      'You do not have to feel grateful to tell the truth about one good thing. A fact is enough. Water. A window. Someone who texted back.',
      'Forcing a bright feeling on top of pain just teaches you to distrust the practice. Let the hard thing stay in the room.',
      'Thank God for one small mercy and leave the rest of the day unnamed if you need to. Gratitude is a way of seeing, not a performance review.',
      'If even one thing feels like too much, thank God that you noticed you are tired. Honesty is a faithful place to start.',
      'Tomorrow’s list can wait. Tonight, one true sentence is a complete prayer.',
    ],
  },
];

export const QUIET_WORDS = [
  { title: 'Enough for Today', text: 'You do not have to finish becoming today. Thank God for the portion of strength that was actually given, and let that be enough.' },
  { title: 'A Quiet Mercy', text: 'Mercy is not a speech. Sometimes it is a slowed breath and the decision not to speak harshly to yourself.' },
  { title: 'Held', text: 'You are not asked to hold the whole day up. Something kinder than your worry is already holding you.' },
  { title: 'Unfinished', text: 'An unfinished task is not an unfinished soul. You can close the day and still be loved.' },
  { title: 'The Next Kind Thing', text: 'You rarely need the whole plan. You need the next kind thing, done without contempt for yourself.' },
  { title: 'Soft Strength', text: 'Gentleness is not the absence of strength. It is strength that has stopped performing.' },
  { title: 'This Breath Counts', text: 'Before the list, there is breath. Thank God for the one you are in, not the one you are chasing.' },
  { title: 'Small Light', text: 'A small light is still light. Do not despise the peace that arrives without explaining itself.' },
  { title: 'Laid Down', text: 'What you cannot carry into sleep can be laid by the door. Morning is allowed to meet it first.' },
  { title: 'Seen', text: 'You do not have to be impressive to be seen. God is not waiting for a better version of you to begin loving you.' },
  { title: 'Room to Feel', text: 'Feeling deeply is not a failure of faith. Bring the feeling with you instead of pretending it left.' },
  { title: 'The Long Exhale', text: 'Let the exhale be longer than the argument in your head. The body often believes the breath before the mind does.' },
  { title: 'Ordinary Holy', text: 'Bread, water, a roof, a hand. Ordinary things are where most of a life is blessed.' },
  { title: 'Not Behind', text: 'You are not late to your own life. The pace of comparison is not the pace of grace.' },
  { title: 'A Softer Voice', text: 'Speak to yourself as you would to someone you have already forgiven. That voice is strong enough to lead.' },
  { title: 'Stay', text: 'You do not have to feel peaceful to stay. Staying for one more gentle minute is a kind of prayer.' },
  { title: 'What Is Real', text: 'Gratitude does not say everything is fine. It says something true and good is also here.' },
  { title: 'Released', text: 'Release what was never yours to repair tonight. Love does not require you to be everyone’s answer.' },
  { title: 'The Door', text: 'Peace often returns the way you left it: through a small door, without announcement.' },
  { title: 'Hands Open', text: 'Open hands cannot clutch the day shut. Let them rest. What is meant to remain will remain.' },
  { title: 'Still Loved', text: 'If the day went badly, you are still loved. Failure is a hard teacher, not a final name.' },
  { title: 'Enough Light to Walk', text: 'You are not promised the whole road. You are given enough light for the next step. Walk that far.' },
  { title: 'Come Back', text: 'Coming back to yourself counts, even if you left a hundred times. Return is the practice.' },
  { title: 'Rest as Trust', text: 'Rest is a way of trusting that the world is not held up by your anxiety. Lay that weight down.' },
  { title: 'A Good Smallness', text: 'You are allowed to be small today. Small is a place where tenderness can find you.' },
  { title: 'The Unseen Work', text: 'Healing does quiet work where no one applauds. Thank God for what is mending without your management.' },
  { title: 'Bless the Ordinary', text: 'Bless the meal, the walk, the message you almost did not send. A life is made of these.' },
  { title: 'No Performance', text: 'You do not have to perform wellness. Honest fatigue, offered simply, is a true prayer.' },
  { title: 'Tomorrow Can Wait', text: 'Tomorrow is not owed your fear tonight. Let it arrive on its own in the morning.' },
  { title: 'Near', text: 'God is not far from a crowded mind. Nearness does not require you to feel calm first.' },
  { title: 'This Chapter', text: 'This is one chapter, and it is not the last. Thank God that the story is still being told with you in it.' },
];

export const ABOUT = [
  ['When to use', 'Morning Reset to start clear. Night Reset to calm your mind before sleep. Meditations anytime. Journal to process your day.'],
  ['What this is NOT', 'Not therapy. Not a replacement for professional mental health care. A real-time first-response tool for everyday emotional moments.'],
  ['No streaks. No guilt.', "Come when you need it. Leave when you're ready. Rest is not failure."],
];

export const CALM_BREATH = [
  { label: 'Breathe in', seconds: 4, scale: 1.48 },
  { label: 'Hold', seconds: 4, scale: 1.48 },
  { label: 'Breathe out', seconds: 6, scale: 1 },
];

export const NIGHT_BREATH = [
  { label: 'Breathe in', seconds: 4, scale: 1.42 },
  { label: 'Hold', seconds: 7, scale: 1.42 },
  { label: 'Breathe out', seconds: 8, scale: 1 },
];
