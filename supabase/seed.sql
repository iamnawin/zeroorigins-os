-- Run AFTER schema and after promoting your user to FOUNDER
do $$
declare
  founder_id uuid;
begin
  select id into founder_id from profiles where role = 'FOUNDER' limit 1;
  if founder_id is null then
    raise notice 'No FOUNDER found. Promote a user first.';
    return;
  end if;

  insert into ideas (title, description, status, priority, owner_id, created_by) values
    ('ZeroOrigins OS', 'Internal + external operating system for ZeroOrigins', 'approved', 'critical', founder_id, founder_id),
    ('Customer Portal', 'Self-serve portal for customers to track projects and proposals', 'submitted', 'high', founder_id, founder_id),
    ('Partner Referral System', 'Track partner referrals, conversions, and commissions', 'under_review', 'medium', founder_id, founder_id),
    ('AI Proposal Agent', 'Auto-generate proposals from discovery call notes using AI', 'draft', 'high', founder_id, founder_id),
    ('Content Automation Engine', 'Automated content pipeline from briefs to published posts', 'draft', 'medium', founder_id, founder_id);

  insert into projects (title, description, status, priority, owner_id, created_by) values
    ('ZeroOrigins Website Rebrand', 'Full website redesign with new brand identity', 'active', 'high', founder_id, founder_id),
    ('IgnAIte AI Bootcamp', 'AI training bootcamp product launch', 'planned', 'medium', founder_id, founder_id),
    ('OrgTrace', 'Organization tracing and intelligence tool', 'draft', 'low', founder_id, founder_id),
    ('Retail Execution / PSS', 'Universal retail execution intelligence platform', 'active', 'critical', founder_id, founder_id),
    ('AIwithNoBrains Content System', 'AI music and creative content automation system', 'paused', 'low', founder_id, founder_id);

  insert into tasks (title, status, project_id, owner_id, created_by) values
    ('Design new homepage layout', 'in_progress', (select id from projects where title = 'ZeroOrigins Website Rebrand' limit 1), founder_id, founder_id),
    ('Set up Supabase project', 'done', (select id from projects where title = 'ZeroOrigins Website Rebrand' limit 1), founder_id, founder_id),
    ('Define bootcamp curriculum', 'todo', (select id from projects where title = 'IgnAIte AI Bootcamp' limit 1), founder_id, founder_id),
    ('Build scoring engine MVP', 'in_progress', (select id from projects where title = 'Retail Execution / PSS' limit 1), founder_id, founder_id),
    ('Create demo video', 'todo', (select id from projects where title = 'Retail Execution / PSS' limit 1), founder_id, founder_id);

  insert into leads (name, email, company, source, status, service_interest, budget_range, owner_id, created_by) values
    ('Rajesh Kumar', 'rajesh@coachingbiz.com', 'CoachingPro India', 'website', 'new', 'AI automation for coaching business', '$500-1000', founder_id, founder_id),
    ('Sarah Mitchell', 'sarah@smallbiz.com', 'Mitchell Designs', 'referral', 'contacted', 'Digital identity and branding', '$200-500', founder_id, founder_id),
    ('Dr. Priya Nair', 'priya@techstitute.edu', 'TechStitute', 'linkedin', 'discovery_scheduled', 'AI workshop for institute', '$1000-2000', founder_id, founder_id);

  insert into partners (name, email, company, type, status, pitch) values
    ('Vikram Sharma', 'vikram@traininginstitute.com', 'AI Skills Academy', 'training_institute', 'new_application', 'Want to co-deliver AI bootcamps to our student base of 500+'),
    ('Aisha Patel', 'aisha@marketingfreelancer.com', 'Aisha Digital', 'marketing_freelancer', 'under_review', 'I refer small businesses who need automation. Looking for referral commission.'),
    ('James Wilson', 'james@referconsult.com', 'ReferConsult', 'referral_consultant', 'approved', 'Active referral partner with 3 successful conversions');
end $$;
