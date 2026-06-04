import { AuthForm } from "./AuthForm";

export default function LoginPage() {
  return (
    <main className="authPage">
      <a className="brand authBrand" href="/">
        <span className="brandMark" aria-hidden="true">
          {Array.from({ length: 18 }).map((_, index) => (
            <i key={index} />
          ))}
        </span>
        <span>OttoMob</span>
      </a>
      <section className="authShell">
        <div className="authIntro">
          <p className="eyebrow">Customer account</p>
          <h1>Manage your SMM service orders from one clean dashboard.</h1>
          <p>
            Use email registration now, or connect Google after you add your OAuth credentials in the environment file.
          </p>
        </div>
        <AuthForm />
      </section>
    </main>
  );
}
