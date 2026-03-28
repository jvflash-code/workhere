export type PerkTemplate = {
  icon: string;
  title: string;
  description: string;
};

export const PERK_TEMPLATES: PerkTemplate[] = [
  { icon: '🏥', title: 'Full Health Coverage',   description: 'Medical, dental, and vision insurance for you and your dependents, fully covered by the company.' },
  { icon: '💰', title: '401(k) with Match',       description: 'We match up to 4% of your salary. Vesting begins immediately so your retirement savings grow from day one.' },
  { icon: '🏠', title: 'Remote-Friendly',         description: 'Work from home, a coffee shop, or our offices. Flexible arrangements are the default, not the exception.' },
  { icon: '🌴', title: 'Unlimited PTO',           description: 'Take the time you need. We trust you to manage your schedule and recharge when necessary.' },
  { icon: '🎓', title: 'Learning Budget',         description: '$2,000–$3,000 per year for courses, conferences, books, and certifications to grow your skills.' },
  { icon: '📈', title: 'Equity Package',          description: 'All full-time employees receive stock options. We grow together.' },
  { icon: '🍼', title: 'Parental Leave',          description: '16 weeks of fully paid leave for all new parents, regardless of how you grew your family.' },
  { icon: '🧠', title: 'Mental Health Support',  description: 'Free therapy sessions through our EAP, plus mental health days that do not count against PTO.' },
  { icon: '🏋️', title: 'Wellness Stipend',       description: '$100/month reimbursement for gym memberships, fitness apps, or any wellness activity you choose.' },
  { icon: '🍕', title: 'Free Meals & Snacks',    description: 'Daily catered lunch and a fully stocked kitchen so you can focus on great work, not grocery runs.' },
  { icon: '✈️', title: 'Team Retreats',          description: 'Twice-yearly all-hands retreats to connect, align, and celebrate wins together.' },
  { icon: '💻', title: 'Home Office Budget',     description: '$1,500 one-time setup budget so your home office is as productive as any office.' },
];
