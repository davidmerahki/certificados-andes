/**
 * Emite credenciales vía la API desplegada en Vercel.
 * Uso: node scripts/prod-emit-by-email.mjs
 * Requiere .env local solo para ADMIN_API_KEY (la llamada va a producción).
 */
import 'dotenv/config';

const BASE = process.env.PROD_API_URL ?? 'https://certificados-andes.vercel.app';
const KEY = process.env.ADMIN_API_KEY;
const COURSE_LW =
  process.env.PROD_COURSE_LW_ID ??
  'fiducia-inmobiliaria-para-la-administracion-de-justicia';

const emails = process.argv.slice(2).length
  ? process.argv.slice(2)
  : ['david@merahki.ai', 'gabrielr@merahki.ai', 'ruth@merahki.ai'];

if (!KEY) {
  console.error('Missing ADMIN_API_KEY in .env');
  process.exit(1);
}

async function api(method, path, body) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': KEY,
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    data = text;
  }
  return { status: res.status, data };
}

async function main() {
  console.log('Target:', BASE);

  const health = await api('GET', '/api/health');
  console.log('health', health.status, health.data);

  // Ensure course exists on production DB
  let courses = await api('GET', '/api/courses');
  if (courses.status >= 500) {
    console.error('Production cannot reach Mongo. Set MONGODB_URI (and other env vars) in Vercel.');
    console.error(courses.data);
    process.exit(1);
  }

  let course = (courses.data?.data ?? []).find(
    (c) => c.learnWorldsCourseId === COURSE_LW,
  );

  if (!course) {
    const reg = await api('POST', '/api/courses', {
      learnWorldsCourseId: COURSE_LW,
      name: 'Fiducia inmobiliaria para la administración de justicia',
      pokTemplateId: 'b3686850-7497-46fd-8001-5c899b2078d4',
      emitterOrganization: 'Merahki / Fundación Ábacos',
      validateRemote: true,
    });
    console.log('register course', reg.status, reg.data);
    course = reg.data?.data;
    if (course?.id) {
      await api('POST', `/api/courses/${course.id}/activate`);
    }
  } else if (course.status !== 'active') {
    await api('POST', `/api/courses/${course.id}/activate`);
  }

  console.log('course', course?.id, course?.status);

  for (const email of emails) {
    const cycle = `prod-manual-${Date.now()}-${email.split('@')[0]}`;
    const emit = await api('POST', '/api/certifications/emit-by-email', {
      email,
      learnWorldsCourseId: COURSE_LW,
      certificationCycle: cycle,
      simulation: false,
    });
    console.log('\n===', email, '===');
    console.log(emit.status, JSON.stringify(emit.data, null, 2).slice(0, 1200));
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
