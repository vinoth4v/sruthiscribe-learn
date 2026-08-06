// Builds the canvas page(s) fed into buildPdfBlob() for a student's progress
// report (build plan §9 Phase 6). Kept separate from pdf.ts: the PDF writer
// is a generic canvas->PDF embedder, this is the app-specific page layout.
const A4W = 595.28, A4H = 841.89;
const SCALE = 2;

export interface ProgressReportData {
  studentName: string;
  generatedAt: Date;
  streak: number;
  minutesPracticed: number;
  courses: Array<{ title: string; percent: number }>;
  ragamAccuracy: Array<{ ragam: string; avgScore: number; attempts: number }>;
}

function newPage(): { cv: HTMLCanvasElement; g: CanvasRenderingContext2D } {
  const cv = document.createElement('canvas');
  cv.width = A4W * SCALE;
  cv.height = A4H * SCALE;
  const g = cv.getContext('2d')!;
  g.fillStyle = '#ffffff';
  g.fillRect(0, 0, cv.width, cv.height);
  g.fillStyle = '#1b1b1f';
  g.scale(SCALE, SCALE);
  return { cv, g };
}

export function buildProgressReportPages(data: ProgressReportData): HTMLCanvasElement[] {
  const { cv, g } = newPage();
  const mx = 48;
  let y = 60;

  g.font = '700 22px sans-serif';
  g.fillText('SruthiScribe Learn — Progress Report', mx, y);
  y += 26;
  g.font = '13px sans-serif';
  g.fillStyle = '#666';
  g.fillText(`${data.studentName} · generated ${data.generatedAt.toLocaleDateString()}`, mx, y);
  y += 40;

  g.fillStyle = '#1b1b1f';
  g.font = '700 15px sans-serif';
  g.fillText('Practice activity', mx, y);
  y += 22;
  g.font = '13px sans-serif';
  g.fillText(`${data.streak} day streak · ${data.minutesPracticed} minutes practiced total`, mx, y);
  y += 36;

  g.font = '700 15px sans-serif';
  g.fillText('Course progress', mx, y);
  y += 22;
  g.font = '13px sans-serif';
  if (data.courses.length === 0) {
    g.fillText('No courses started yet.', mx, y);
    y += 18;
  }
  for (const c of data.courses) {
    g.fillText(`${c.title}`, mx, y);
    g.fillText(`${Math.round(c.percent)}%`, mx + 380, y);
    y += 18;
  }
  y += 20;

  g.font = '700 15px sans-serif';
  g.fillText('Accuracy by ragam', mx, y);
  y += 22;
  g.font = '13px sans-serif';
  if (data.ragamAccuracy.length === 0) {
    g.fillText('No practice attempts yet.', mx, y);
    y += 18;
  }
  for (const r of data.ragamAccuracy) {
    g.fillText(`${r.ragam}`, mx, y);
    g.fillText(`${r.avgScore}% (${r.attempts} attempt${r.attempts === 1 ? '' : 's'})`, mx + 380, y);
    y += 18;
  }

  return [cv];
}
