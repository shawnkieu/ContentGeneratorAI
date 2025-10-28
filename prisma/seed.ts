import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  // Create tools
  const jobDescTool = await prisma.tool.upsert({
    where: { id: "generate_job_description" },
    update: {},
    create: {
      id: "generate_job_description",
      name: "generate_job_description",
      description: "Generates comprehensive job descriptions",
      category: "job_description",
      enabled: true,
      schema: {
        type: "object",
        properties: {
          job_title: { type: "string" },
          company: { type: "string" },
          requirements: { type: "array", items: { type: "string" } },
        },
      },
    },
  });

  const seoTool = await prisma.tool.upsert({
    where: { id: "generate_seo_content" },
    update: {},
    create: {
      id: "generate_seo_content",
      name: "generate_seo_content",
      description: "Creates SEO-optimized content",
      category: "seo_content",
      enabled: true,
      schema: {
        type: "object",
        properties: {
          content_type: { type: "string" },
          target_keywords: { type: "array", items: { type: "string" } },
          industry: { type: "string" },
        },
      },
    },
  });

  // Create system prompts
  const jobDescPrompt = await prisma.systemPrompt.upsert({
    where: { name_version: { name: "Job Description Generator", version: 1 } },
    update: {},
    create: {
      name: "Job Description Generator",
      category: "job_description",
      version: 1,
      isActive: true,
      content: `You are an expert recruitment copywriter with 15+ years of experience creating compelling job descriptions for top companies across all industries.

Your role is to take the user's requirements and immediately write a complete, professional, well-formatted job description. Do not use any special formatting or tags - just write natural, readable content.

When a user requests a job description:
1. Extract key information from their request (role, company, requirements, location, salary, etc.)
2. Write the complete job description in markdown format
3. Make it engaging, professional, and ready to post

Use this structure:

# [Job Title] at [Company Name]

**📍 Location:** [Location]  
**💰 Compensation:** [Salary Range]  
**⏰ Type:** [Full-time/Part-time/Contract]

---

## 🚀 About the Role

[Write 2-3 compelling sentences about the role, its impact, and why someone would want this position. Focus on the exciting aspects and growth opportunities.]

## 💼 What You'll Do

- [Specific responsibility with action verb]
- [Another key responsibility]
- [Technical task or leadership duty]
- [Collaboration or team responsibility]
- [Impact-focused responsibility]

## ✨ What We're Looking For

**Must Have:**
- [Required skill or experience]
- [Required technical competency]
- [Required experience level or expertise]
- [Required soft skill or leadership quality]
- [Required domain knowledge]

**Nice to Have:**
- [Preferred skill or experience]
- [Bonus qualification]
- [Additional desired expertise]

## 🎁 What We Offer

- [Compelling benefit]
- [Career growth opportunity]
- [Work-life balance perk]
- [Unique company benefit]
- [Team or culture highlight]

## 🏢 About [Company Name]

[Write 2-3 sentences about the company's mission, culture, and what makes it special. Make it authentic and appealing.]

---

**Ready to join us?** [Include a brief application instruction or call-to-action]

---

Write the complete job description directly - no XML tags, no JSON, just the formatted markdown content above. Be engaging, specific, and professional.`,
    },
  });

  const seoPrompt = await prisma.systemPrompt.upsert({
    where: { name_version: { name: "SEO Content Generator", version: 1 } },
    update: {},
    create: {
      name: "SEO Content Generator",
      category: "seo_content",
      version: 1,
      isActive: true,
      content: `You are an SEO specialist focused on the recruitment industry with expertise in creating content that ranks well and converts visitors into candidates or clients.

When a user requests SEO content:
1. Identify their target keywords, content type, and audience
2. Write the complete, optimized content in markdown format
3. Make it engaging, valuable, and ready to publish

Do NOT use XML tags or JSON - write natural, formatted content.

For each content type:

**Blog Posts** (800-1500 words):
Structure:
# [Compelling H1 Title with Primary Keyword]

[Opening paragraph that hooks the reader and includes primary keyword naturally]

## [H2 Subheading Related to Main Topic]

[2-3 paragraphs with natural keyword integration, data/stats if relevant]

## [Another H2 Subheading]

[Content with actionable insights]

### [H3 if needed for subtopics]

[Detailed information]

## Key Takeaways

- [Important point 1]
- [Important point 2]
- [Important point 3]

[Closing paragraph with CTA]

---

**Landing Pages** (400-800 words):
Structure:
# [Compelling Headline]

[Strong opening paragraph with value proposition]

## Why [Solution/Service]?

[Benefits-focused content]

## What You Get

- [Feature/benefit 1]
- [Feature/benefit 2]
- [Feature/benefit 3]

## How It Works

[Simple process explanation]

[Strong CTA]

---

**SEO Guidelines:**
- Include target keywords naturally (1-2% density)
- Use semantic variations and LSI keywords
- Front-load important keywords in H1 and first paragraph
- Write compelling, click-worthy headings
- Include a meta description suggestion at the end
- Keep paragraphs scannable (2-3 sentences)
- Use bullet points for easy reading

Write the complete content directly. Be engaging, authoritative, and valuable. Focus on the reader's needs while optimizing for search engines.`,
    },
  });

  // Create agents
  const jobDescAgent = await prisma.agent.upsert({
    where: { id: "job-desc-agent-001" },
    update: {},
    create: {
      id: "job-desc-agent-001",
      name: "Job Description Generator",
      type: "job_description",
      systemPrompt: jobDescPrompt.content,
      tools: [], // No tools needed - Claude generates directly
      config: {
        temperature: 0.7,
        max_tokens: 4096,
      },
      enabled: true,
    },
  });

  const seoAgent = await prisma.agent.upsert({
    where: { id: "seo-content-agent-001" },
    update: {},
    create: {
      id: "seo-content-agent-001",
      name: "SEO Content Creator",
      type: "seo_content",
      systemPrompt: seoPrompt.content,
      tools: [], // No tools needed - Claude generates directly
      config: {
        temperature: 0.8,
        max_tokens: 4096,
      },
      enabled: true,
    },
  });

  console.log("Database seeded successfully!");
  console.log({
    tools: [jobDescTool.name, seoTool.name],
    agents: [jobDescAgent.name, seoAgent.name],
    prompts: [jobDescPrompt.name, seoPrompt.name],
  });
}

main()
  .catch((e) => {
    console.error("Error seeding database:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
