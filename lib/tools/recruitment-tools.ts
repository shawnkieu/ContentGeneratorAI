import { z } from "zod";

// Zod schemas for validation
export const jobDescriptionSchema = z.object({
  job_title: z.string().min(1, "Job title is required"),
  company: z.string().min(1, "Company name is required"),
  department: z.string().optional(),
  requirements: z
    .array(z.string())
    .min(1, "At least one requirement is needed"),
  responsibilities: z.array(z.string()).optional(),
  benefits: z.array(z.string()).optional(),
  location: z.string().optional(),
  salary_range: z.string().optional(),
  employment_type: z
    .enum(["full-time", "part-time", "contract", "internship"])
    .optional(),
});

export const seoContentSchema = z.object({
  content_type: z.enum([
    "blog_post",
    "landing_page",
    "job_listing",
    "company_page",
  ]),
  target_keywords: z
    .array(z.string())
    .min(1, "At least one keyword is required"),
  industry: z.string().min(1, "Industry is required"),
  word_count: z.number().min(100).max(5000).optional(),
  tone: z
    .enum(["professional", "casual", "authoritative", "friendly"])
    .optional(),
  target_audience: z.string().optional(),
});

// Tool definitions for Claude
export const recruitmentTools = [
  {
    name: "generate_job_description",
    description:
      "Generates a comprehensive, well-structured job description based on role requirements, company information, and best practices in recruitment marketing. Outputs formatted text ready for job boards.",
    input_schema: {
      type: "object",
      properties: {
        job_title: {
          type: "string",
          description:
            "The title of the position (e.g., 'Senior Software Engineer', 'Marketing Manager')",
        },
        company: {
          type: "string",
          description: "Company name",
        },
        department: {
          type: "string",
          description: "Department or team the role belongs to",
        },
        requirements: {
          type: "array",
          items: { type: "string" },
          description:
            "List of required skills, qualifications, and experience",
        },
        responsibilities: {
          type: "array",
          items: { type: "string" },
          description: "Key responsibilities and day-to-day tasks",
        },
        benefits: {
          type: "array",
          items: { type: "string" },
          description: "Employee benefits and perks",
        },
        location: {
          type: "string",
          description:
            "Job location (e.g., 'San Francisco, CA', 'Remote', 'Hybrid - NYC')",
        },
        salary_range: {
          type: "string",
          description: "Salary range or compensation details",
        },
        employment_type: {
          type: "string",
          enum: ["full-time", "part-time", "contract", "internship"],
          description: "Type of employment",
        },
      },
      required: ["job_title", "company", "requirements"],
    },
  },
  {
    name: "generate_seo_content",
    description:
      "Creates SEO-optimized content specifically for the recruitment industry. Generates blog posts, landing pages, or other content that ranks well and attracts qualified candidates or clients.",
    input_schema: {
      type: "object",
      properties: {
        content_type: {
          type: "string",
          enum: ["blog_post", "landing_page", "job_listing", "company_page"],
          description: "Type of content to generate",
        },
        target_keywords: {
          type: "array",
          items: { type: "string" },
          description: "Primary and secondary keywords to target for SEO",
        },
        industry: {
          type: "string",
          description:
            "Specific recruitment industry or niche (e.g., 'tech recruitment', 'healthcare staffing', 'executive search')",
        },
        word_count: {
          type: "number",
          description: "Target word count for the content (default: 800)",
        },
        tone: {
          type: "string",
          enum: ["professional", "casual", "authoritative", "friendly"],
          description: "Desired tone of voice for the content",
        },
        target_audience: {
          type: "string",
          description:
            "Intended audience (e.g., 'job seekers', 'hiring managers', 'HR professionals')",
        },
      },
      required: ["content_type", "target_keywords", "industry"],
    },
  },
];

// Tool execution handlers
export async function executeJobDescriptionTool(
  args: z.infer<typeof jobDescriptionSchema>
) {
  // Validate input
  const validated = jobDescriptionSchema.parse(args);

  // Format the structured data for the AI to use
  return {
    type: "job_description_data",
    data: validated,
    instruction:
      "Use this structured data to create a compelling, professional job description following recruitment best practices.",
  };
}

export async function executeSeoContentTool(
  args: z.infer<typeof seoContentSchema>
) {
  // Validate input
  const validated = seoContentSchema.parse(args);

  return {
    type: "seo_content_data",
    data: validated,
    instruction:
      "Generate SEO-optimized content using these parameters. Include proper heading structure (H1, H2, H3), meta description, and natural keyword integration.",
  };
}
