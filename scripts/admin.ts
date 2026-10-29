// Usuarios del panel de administración. No hay registro desde la web: se crean desde el servidor.
//
//   npm run admin -- crear email@dominio.com "Nombre"   crea el usuario, o le renueva contraseña y 2FA
//   npm run admin -- desactivar email@dominio.com        le corta el acceso y cierra sus sesiones
//   npm run admin -- listar
//
// En el servidor (docker compose): docker compose run --rm admin crear email@dominio.com "Nombre"
import { createInterface } from "node:readline";
import { Writable } from "node:stream";
import { PrismaClient } from "@prisma/client";
import QRCode from "qrcode";
import { hashPassword, passwordProblem } from "../src/lib/admin/password";
import { generateTotpSecret, otpauthUrl, verifyTotp } from "../src/lib/admin/totp";
import { seal } from "../src/lib/admin/secret-box";

// ADMIN_SECRET sale de .env (en Docker llega como variable de entorno)
try { process.loadEnvFile(".env"); } catch {}

const db = new PrismaClient();

/** Pregunta por consola; con `hidden` no se ve lo que se escribe */
function ask(question: string, hidden = false) {
  let muted = false;
  const output = new Writable({
    write(chunk, _enc, cb) {
      if (!muted) process.stdout.write(chunk);
      cb();
    },
  });
  const rl = createInterface({ input: process.stdin, output, terminal: true });
  return new Promise<string>((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      if (hidden) process.stdout.write("\n");
      resolve(answer.trim());
    });
    muted = hidden;
  });
}

async function create(email: string, name: string) {
  email = email.toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error("Email inválido.");
  if (!name) throw new Error('Falta el nombre: npm run admin -- crear email "Nombre"');
  const existing = await db.adminUser.findUnique({ where: { email } });
  if (existing && (await ask(`${email} ya existe. ¿Renovarle contraseña y 2FA? (s/n) `)).toLowerCase() !== "s") return;

  let password = "";
  for (;;) {
    password = await ask("Contraseña (no se ve al escribir): ", true);
    const problem = passwordProblem(password, email);
    if (problem) { console.log(`  ${problem}`); continue; }
    if ((await ask("Repetila: ", true)) !== password) { console.log("  No coinciden."); continue; }
    break;
  }

  const secret = generateTotpSecret();
  console.log("\nEscaneá este QR con la app de autenticación (Google Authenticator, Authy, 1Password…):\n");
  console.log(await QRCode.toString(otpauthUrl(secret, email), { type: "terminal", small: true }));
  console.log(`O cargá el código a mano: ${secret.match(/.{1,4}/g)!.join(" ")}\n`);
  for (;;) {
    const code = await ask("Código de 6 dígitos que muestra la app: ");
    if (verifyTotp(secret, code, 0) !== null) break;
    console.log("  No coincide. Revisá que la hora del celular esté en automático y probá con el código nuevo.");
  }

  const data = { name, passwordHash: await hashPassword(password), totpSecret: seal(secret), lastTotpStep: 0, failedLogins: 0, lockedUntil: null, active: true };
  const user = await db.adminUser.upsert({ where: { email }, update: data, create: { email, ...data } });
  await db.adminSession.deleteMany({ where: { userId: user.id } });
  await db.adminLog.create({ data: { userId: user.id, action: existing ? "usuario.renovado" : "usuario.creado", target: email, ip: "consola" } });
  console.log(`\nListo: ${email} ya puede entrar en /admin`);
}

async function deactivate(email: string) {
  const user = await db.adminUser.update({ where: { email: email.toLowerCase() }, data: { active: false } });
  await db.adminSession.deleteMany({ where: { userId: user.id } });
  await db.adminLog.create({ data: { userId: user.id, action: "usuario.desactivado", target: user.email, ip: "consola" } });
  console.log(`${user.email} ya no puede entrar.`);
}

async function list() {
  const users = await db.adminUser.findMany({ orderBy: { createdAt: "asc" } });
  if (!users.length) console.log("Todavía no hay usuarios.");
  for (const u of users) {
    console.log(`${u.active ? "activo  " : "inactivo"}  ${u.email}  (${u.name})  último ingreso: ${u.lastLoginAt?.toLocaleString("es-AR") ?? "nunca"}`);
  }
}

async function main() {
  const [command, ...args] = process.argv.slice(2);
  if (command === "crear") return create(args[0] ?? "", args.slice(1).join(" ").trim());
  if (command === "desactivar") return deactivate(args[0] ?? "");
  if (command === "listar") return list();
  console.log('Uso: npm run admin -- crear email "Nombre" | desactivar email | listar');
}

main()
  .catch((e) => {
    console.error(e instanceof Error ? e.message : e);
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
