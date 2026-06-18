-- Backfill RSS feed URLs for Phase 2 Radar ingest.

update radar_sources
set rss_url = case name
  when 'OpenAI News' then 'https://openai.com/news/rss.xml'
  when 'Google AI Blog' then 'https://blog.google/technology/ai/rss/'
  when 'Hugging Face Blog' then 'https://huggingface.co/blog/feed.xml'
  when 'Salesforce Ben' then 'https://www.salesforceben.com/feed/'
  when 'YourStory' then 'https://yourstory.com/feed'
  when 'Product Hunt AI' then 'https://www.producthunt.com/feed'
  when 'GitHub Trending AI' then 'https://mshibanami.github.io/GitHubTrendingRSS/daily/all.xml'
  else rss_url
end,
updated_at = now()
where name in (
  'OpenAI News',
  'Google AI Blog',
  'Hugging Face Blog',
  'Salesforce Ben',
  'YourStory',
  'Product Hunt AI',
  'GitHub Trending AI'
);
