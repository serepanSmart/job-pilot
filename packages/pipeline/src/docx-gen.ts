import {
  AlignmentType,
  Document,
  HeadingLevel,
  Packer,
  Paragraph,
  TextRun,
} from 'docx';
import { writeFileSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { z } from 'zod';

export interface CvRole {
  bullets: string[];
  period: string;
  tech: string;
  title: string;
}

export interface CvExperience {
  company: string;
  companyLocation: string;
  companyPeriod: string;
  roles: CvRole[];
}

export interface CvData {
  certifications: string[];
  coreCompetencies: string[];
  education: { degree: string; institution: string; period: string }[];
  email: string;
  experience: CvExperience[];
  github: string;
  languages: { language: string; level: string }[];
  linkedin: string;
  location: string;
  name: string;
  phone: string;
  portfolio: string;
  summary: string;
  targetTitle: string;
  technologies: Record<string, string>;
  workMode: string;
}

const CvRoleSchema = z.object({
  bullets: z.array(z.string()),
  period: z.string(),
  tech: z.string(),
  title: z.string(),
});

const CvExperienceSchema = z.object({
  company: z.string(),
  companyLocation: z.string(),
  companyPeriod: z.string(),
  roles: z.array(CvRoleSchema),
});

const CvDataSchema = z.object({
  certifications: z.array(z.string()),
  coreCompetencies: z.array(z.string()),
  education: z.array(
    z.object({
      degree: z.string(),
      institution: z.string(),
      period: z.string(),
    })
  ),
  email: z.string(),
  experience: z.array(CvExperienceSchema),
  github: z.string(),
  languages: z.array(z.object({ language: z.string(), level: z.string() })),
  linkedin: z.string(),
  location: z.string(),
  name: z.string(),
  phone: z.string(),
  portfolio: z.string(),
  summary: z.string(),
  targetTitle: z.string(),
  technologies: z.record(z.string(), z.string()),
  workMode: z.string(),
});

const FONT = 'Calibri';
const SIZE_BODY = 22;
const SIZE_NAME = 32;
const SIZE_SUBHEAD = 22;

const h1 = (text: string): Paragraph => {
  return new Paragraph({
    children: [
      new TextRun({
        bold: true,
        font: FONT,
        size: SIZE_BODY,
        text: text.toUpperCase(),
      }),
    ],
    heading: HeadingLevel.HEADING_1,
    spacing: { before: 200, after: 80 },
    border: { bottom: { color: '999999', size: 4, space: 2, style: 'single' } },
  });
};

const body = (
  text: string,
  opts?: { bold?: boolean; indent?: boolean }
): Paragraph => {
  return new Paragraph({
    children: [
      new TextRun({
        bold: opts?.bold,
        font: FONT,
        size: SIZE_BODY,
        text,
      }),
    ],
    indent: opts?.indent ? { left: 360 } : undefined,
    spacing: { after: 60 },
  });
};

const bullet = (text: string): Paragraph => {
  return new Paragraph({
    bullet: { level: 0 },
    children: [new TextRun({ font: FONT, size: SIZE_BODY, text })],
    spacing: { after: 40 },
  });
};

const contactLine = (cv: CvData): Paragraph => {
  const parts = [
    cv.email,
    cv.phone,
    cv.linkedin,
    cv.github,
    cv.portfolio,
  ].filter(Boolean);
  return new Paragraph({
    alignment: AlignmentType.CENTER,
    children: [
      new TextRun({ font: FONT, size: SIZE_SUBHEAD, text: parts.join(' | ') }),
    ],
    spacing: { after: 60 },
  });
};

export const buildDocument = (cv: CvData): Document => {
  const children: Paragraph[] = [];

  children.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({ bold: true, font: FONT, size: SIZE_NAME, text: cv.name }),
      ],
      spacing: { after: 40 },
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({
          font: FONT,
          size: SIZE_SUBHEAD,
          text: `${cv.targetTitle} | ${cv.location} | ${cv.workMode}`,
        }),
      ],
      spacing: { after: 40 },
    }),
    contactLine(cv)
  );

  children.push(h1('Professional Summary'), body(cv.summary));

  children.push(h1('Technical Skills'));
  for (const [cat, techs] of Object.entries(cv.technologies)) {
    children.push(body(`${cat}: ${techs}`, { bold: false }));
  }

  children.push(h1('Core Competencies'));
  children.push(body(cv.coreCompetencies.join(' | ')));

  children.push(h1('Professional Experience'));
  for (const exp of cv.experience) {
    children.push(
      body(`${exp.company} | ${exp.companyLocation} | ${exp.companyPeriod}`, {
        bold: true,
      })
    );
    for (const role of exp.roles) {
      children.push(
        body(`${role.title} | ${role.period}`, { bold: true, indent: true })
      );
      for (const b of role.bullets) {
        children.push(bullet(b));
      }
      if (role.tech) {
        children.push(body(`Tech: ${role.tech}`, { indent: true }));
      }
    }
  }

  children.push(h1('Education'));
  for (const ed of cv.education) {
    children.push(body(`${ed.degree} — ${ed.institution} | ${ed.period}`));
  }

  if (cv.certifications.length) {
    children.push(h1('Certifications'));
    for (const cert of cv.certifications) {
      children.push(bullet(cert));
    }
  }

  children.push(h1('Languages'));
  for (const lang of cv.languages) {
    children.push(body(`${lang.language} — ${lang.level}`));
  }

  return new Document({
    sections: [
      {
        children,
        properties: {
          page: {
            margin: { bottom: 1080, left: 1080, right: 1080, top: 1080 },
          },
        },
      },
    ],
    styles: {
      paragraphStyles: [
        {
          id: 'Heading1',
          name: 'Heading 1',
          run: { bold: true, color: '1F1F1F', font: FONT, size: SIZE_BODY },
        },
      ],
    },
  });
};

const main = async (): Promise<void> => {
  const jsonPath = process.argv[2];
  const outPath = process.argv[3];

  if (!jsonPath || !outPath) {
    console.error('Usage: tsx docx-gen.ts <cv.json> <output.docx>');
    process.exit(1);
  }

  const cv: CvData = CvDataSchema.parse(
    JSON.parse(readFileSync(jsonPath, 'utf8'))
  );
  const doc = buildDocument(cv);
  const buffer = await Packer.toBuffer(doc);
  writeFileSync(path.resolve(outPath), buffer);
  console.log(`Written: ${outPath}`);
};

const __filename = fileURLToPath(import.meta.url);
if (
  process.argv[1] === __filename ||
  process.argv[1]?.endsWith('/docx-gen.ts') ||
  process.argv[1]?.endsWith('/docx-gen.js')
) {
  await main();
}
