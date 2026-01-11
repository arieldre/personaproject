require('dotenv').config();

const bcrypt = require('bcryptjs');
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

async function seed() {
  const client = await pool.connect();
  
  try {
    console.log('🌱 Seeding database...\n');

    // Create super admin
    const superAdminEmail = process.env.SUPER_ADMIN_EMAIL || 'admin@personaplatform.com';
    const superAdminPassword = process.env.SUPER_ADMIN_PASSWORD || 'changeme123';

    // Check if super admin exists
    const { rows: existingAdmin } = await client.query(
      `SELECT id FROM users WHERE email = $1`,
      [superAdminEmail]
    );

    if (existingAdmin.length === 0) {
      const passwordHash = await bcrypt.hash(superAdminPassword, 12);
      
      await client.query(
        `INSERT INTO users (email, password_hash, first_name, last_name, role, email_verified, is_active)
         VALUES ($1, $2, 'Super', 'Admin', 'super_admin', true, true)`,
        [superAdminEmail, passwordHash]
      );
      
      console.log(`✅ Super admin created: ${superAdminEmail}`);
      console.log(`   Password: ${superAdminPassword}`);
      console.log('   ⚠️  Please change this password immediately!\n');
    } else {
      console.log(`⏭️  Super admin already exists: ${superAdminEmail}\n`);
    }

    // Create demo company if in development
    if (process.env.NODE_ENV === 'development' || process.env.CREATE_DEMO_DATA === 'true') {
      console.log('📦 Creating demo data...\n');

      // Get super admin id
      const { rows: adminRows } = await client.query(
        `SELECT id FROM users WHERE email = $1`,
        [superAdminEmail]
      );
      const superAdminId = adminRows[0].id;

      // Check if demo company exists
      const { rows: existingCompany } = await client.query(
        `SELECT id FROM companies WHERE slug = 'demo-company'`
      );

      let companyId;

      if (existingCompany.length === 0) {
        // Create demo company
        const { rows: companyRows } = await client.query(
          `INSERT INTO companies (name, slug, industry, company_size, license_count, subscription_status, created_by)
           VALUES ('Demo Company', 'demo-company', 'Technology', 'medium', 50, 'active', $1)
           RETURNING id`,
          [superAdminId]
        );
        companyId = companyRows[0].id;
        console.log('✅ Demo company created');
      } else {
        companyId = existingCompany[0].id;
        console.log('⏭️  Demo company already exists');
      }

      // Create demo admin user
      const demoAdminEmail = 'demo-admin@democompany.com';
      const { rows: existingDemoAdmin } = await client.query(
        `SELECT id FROM users WHERE email = $1`,
        [demoAdminEmail]
      );

      if (existingDemoAdmin.length === 0) {
        const demoPasswordHash = await bcrypt.hash('demo123', 12);
        await client.query(
          `INSERT INTO users (email, password_hash, first_name, last_name, role, company_id, email_verified, is_active)
           VALUES ($1, $2, 'Demo', 'Admin', 'company_admin', $3, true, true)`,
          [demoAdminEmail, demoPasswordHash, companyId]
        );
        console.log(`✅ Demo admin created: ${demoAdminEmail} / demo123`);
      } else {
        console.log(`⏭️  Demo admin already exists`);
      }

      // Create demo regular user
      const demoUserEmail = 'demo-user@democompany.com';
      const { rows: existingDemoUser } = await client.query(
        `SELECT id FROM users WHERE email = $1`,
        [demoUserEmail]
      );

      if (existingDemoUser.length === 0) {
        const demoPasswordHash = await bcrypt.hash('demo123', 12);
        await client.query(
          `INSERT INTO users (email, password_hash, first_name, last_name, role, company_id, email_verified, is_active)
           VALUES ($1, $2, 'Demo', 'User', 'user', $3, true, true)`,
          [demoUserEmail, demoPasswordHash, companyId]
        );
        console.log(`✅ Demo user created: ${demoUserEmail} / demo123`);
      } else {
        console.log(`⏭️  Demo user already exists`);
      }

      // Create sample questionnaire
      const { rows: existingQuestionnaire } = await client.query(
        `SELECT id FROM questionnaires WHERE company_id = $1 AND name = 'Team Communication Survey'`,
        [companyId]
      );

      if (existingQuestionnaire.length === 0) {
        // Get default template
        const { rows: templates } = await client.query(
          `SELECT id FROM questionnaire_templates WHERE is_default = true LIMIT 1`
        );

        if (templates.length > 0) {
          await client.query(
            `INSERT INTO questionnaires (company_id, template_id, name, description, status, access_code, created_by)
             VALUES ($1, $2, 'Team Communication Survey', 'Help us understand how you prefer to communicate and work with your team.', 'active', 'DEMO12345', $3)`,
            [companyId, templates[0].id, superAdminId]
          );
          console.log('✅ Sample questionnaire created (access code: DEMO12345)');
        }
      } else {
        console.log('⏭️  Sample questionnaire already exists');
      }

      // Create sample personas
      const { rows: existingPersonas } = await client.query(
        `SELECT id FROM personas WHERE company_id = $1`,
        [companyId]
      );

      if (existingPersonas.length === 0) {
        const samplePersonas = [
          {
            name: 'Alex',
            tagline: 'The Analytical Problem-Solver',
            summary: {
              demographics: { role_type: 'Senior Engineer', experience_level: 'Senior' },
              communication_style: { preferred: 'Direct', tone: 'Professional', details: 'Prefers data-driven discussions' },
              values: ['Efficiency', 'Quality', 'Innovation'],
              pain_points: ['Unclear requirements', 'Unnecessary meetings'],
              motivations: ['Solving complex problems', 'Learning new technologies'],
              key_traits: ['Analytical', 'Detail-oriented', 'Independent']
            },
            extended_profile: {
              background_story: 'Alex has been in tech for over a decade, starting as a junior developer and working up to a senior position. They value efficiency and getting things done right the first time.',
              conversation_guidelines: 'Be direct and factual. Alex appreciates when you get to the point quickly and support your ideas with data.',
              behavioral_patterns: ['Prefers async communication', 'Likes to think before responding', 'Values documentation'],
              topic_opinions: {
                meetings: 'Should be rare and purposeful',
                change: 'Good when backed by evidence'
              }
            }
          },
          {
            name: 'Jordan',
            tagline: 'The Collaborative Team Builder',
            summary: {
              demographics: { role_type: 'Project Manager', experience_level: 'Mid-level' },
              communication_style: { preferred: 'Collaborative', tone: 'Friendly', details: 'Enjoys brainstorming and group discussions' },
              values: ['Teamwork', 'Transparency', 'Growth'],
              pain_points: ['Silos between teams', 'Lack of communication'],
              motivations: ['Team success', 'Building relationships'],
              key_traits: ['Empathetic', 'Organized', 'People-oriented']
            },
            extended_profile: {
              background_story: 'Jordan transitioned into project management after starting in customer success. They excel at bringing people together and ensuring everyone feels heard.',
              conversation_guidelines: 'Jordan appreciates when you acknowledge feelings and consider the human side of decisions.',
              behavioral_patterns: ['Checks in frequently', 'Prefers video calls over text', 'Celebrates team wins'],
              topic_opinions: {
                meetings: 'Essential for alignment and connection',
                change: 'Exciting opportunity for growth'
              }
            }
          },
          {
            name: 'Sam',
            tagline: 'The Steady Executor',
            summary: {
              demographics: { role_type: 'Operations Specialist', experience_level: 'Mid-level' },
              communication_style: { preferred: 'Structured', tone: 'Formal', details: 'Likes clear processes and documentation' },
              values: ['Reliability', 'Stability', 'Quality'],
              pain_points: ['Constant changes', 'Ambiguity'],
              motivations: ['Getting things right', 'Maintaining standards'],
              key_traits: ['Reliable', 'Methodical', 'Cautious']
            },
            extended_profile: {
              background_story: 'Sam has built their career on being the reliable person who ensures things run smoothly. They take pride in maintaining high standards and consistent output.',
              conversation_guidelines: 'Provide clear context and expectations. Sam works best when they understand the full picture and have time to plan.',
              behavioral_patterns: ['Follows established processes', 'Documents everything', 'Prefers advance notice for changes'],
              topic_opinions: {
                meetings: 'Useful when they have clear agendas',
                change: 'Necessary but should be gradual'
              }
            }
          }
        ];

        for (const persona of samplePersonas) {
          await client.query(
            `INSERT INTO personas (company_id, name, tagline, status, summary, extended_profile, generated_at)
             VALUES ($1, $2, $3, 'active', $4, $5, NOW())`,
            [companyId, persona.name, persona.tagline, JSON.stringify(persona.summary), JSON.stringify(persona.extended_profile)]
          );
        }
        console.log('✅ Sample personas created (Alex, Jordan, Sam)');
      } else {
        console.log('⏭️  Sample personas already exist');
      }
    }

    console.log('\n✨ Seeding complete!');

  } finally {
    client.release();
    await pool.end();
  }
}

// Run seeder
seed()
  .then(() => {
    console.log('\n🎉 Seed process complete');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Seeding failed:', error);
    process.exit(1);
  });
