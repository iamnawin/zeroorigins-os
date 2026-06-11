#!/usr/bin/env node
/**
 * Manual seed script for AI Workspace apps
 * Uses the anon key through the client API
 */

import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

const sampleApps = [
  {
    name: 'ZeroOrigins OS',
    description: 'Internal company operating system for managing projects, leads, and AI workspace experiments.',
    status: 'deployed',
    category: 'internal_tool',
    app_type: 'web_app',
    folder_group: 'Live',
    priority: 'high',
    github_url: 'https://github.com/iamnawin/zeroorigins-os',
    vercel_url: 'https://zeroorigins-os.vercel.app',
    live_url: 'https://os.zeroorigins.com',
    business_value: 'Centralized command center for all ZeroOrigins operations, tracking, and automation.',
    target_user: 'Internal ZeroOrigins team',
    is_internal_tool: true,
    is_sellable_product: false,
    next_action: 'Deploy visual system upgrade'
  },
  {
    name: 'PLOTDNA-AI',
    description: 'AI-powered tool for generating complex data visualizations and analytical plots.',
    status: 'in_progress',
    category: 'ai_tool',
    app_type: 'web_app',
    folder_group: 'Repos',
    priority: 'medium',
    github_url: 'https://github.com/iamnawin/plotdna-ai',
    business_value: 'Automated data visualization for researchers and analysts.',
    target_user: 'Data scientists, researchers',
    is_internal_tool: false,
    is_sellable_product: true,
    next_action: 'Complete MVP features'
  },
  {
    name: 'Portfolio V3',
    description: 'Personal portfolio website showcasing projects and skills.',
    status: 'deployed',
    category: 'website',
    app_type: 'web_app',
    folder_group: 'Live',
    priority: 'low',
    github_url: 'https://github.com/iamnawin/portfolio-v3',
    vercel_url: 'https://portfolio-v3.vercel.app',
    live_url: 'https://naveen.zeroorigins.com',
    business_value: 'Professional presence and client acquisition.',
    target_user: 'Potential clients, employers',
    is_internal_tool: false,
    is_sellable_product: false,
    next_action: 'Update with recent projects'
  },
  {
    name: 'Applyo Platform',
    description: 'Job application tracking and management platform.',
    status: 'active',
    category: 'productivity_tool',
    app_type: 'web_app',
    folder_group: 'Repos',
    priority: 'medium',
    github_url: 'https://github.com/iamnawin/applyo-platform',
    business_value: 'Streamlined job search and application management.',
    target_user: 'Job seekers, career changers',
    is_internal_tool: false,
    is_sellable_product: true,
    next_action: 'Add integration with job boards'
  },
  {
    name: 'ServiceOps Pulse',
    description: 'Salesforce-integrated service operations monitoring dashboard.',
    status: 'idea',
    category: 'integration',
    app_type: 'salesforce_app',
    folder_group: 'Ideas',
    priority: 'high',
    business_value: 'Real-time service health monitoring for enterprise customers.',
    target_user: 'Enterprise IT teams',
    is_internal_tool: false,
    is_sellable_product: true,
    next_action: 'Create technical specifications'
  }
]

async function seedApps() {
  console.log('🌱 Seeding AI Workspace apps...')
  
  try {
    // First, check if we can connect and if there are existing apps
    const { data: existingApps, error: checkError } = await supabase
      .from('ai_workspace_apps')
      .select('name')
      .limit(5)
    
    if (checkError) {
      console.error('❌ Error connecting to database:', checkError)
      return
    }
    
    console.log(`📊 Found ${existingApps?.length || 0} existing apps`)
    
    // Insert sample apps
    for (const app of sampleApps) {
      const { data, error } = await supabase
        .from('ai_workspace_apps')
        .upsert(app, { onConflict: 'name' })
        .select()
      
      if (error) {
        console.error(`❌ Failed to upsert ${app.name}:`, error)
      } else {
        console.log(`✅ Upserted: ${app.name}`)
      }
    }
    
    console.log('\n🎉 Seeding complete!')
    
  } catch (error) {
    console.error('❌ Unexpected error:', error)
  }
}

seedApps()