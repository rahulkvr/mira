export default function Home() {
  return (
    <main className="page">
      <header className="header">
        <p className="eyebrow">Travel Companion</p>
        <h1>Commute Compose</h1>
        <p className="subtitle">
          Generate a soundtrack that matches your journey length and mood.
        </p>
      </header>

      <section className="card">
        <label className="field">
          <span>Start location</span>
          <input placeholder="Hamburg Hbf" />
        </label>
        <label className="field">
          <span>End location</span>
          <input placeholder="Altona" />
        </label>
        <button type="button" className="primary">
          Generate my soundtrack
        </button>
      </section>

      <section className="card">
        <h2>What you will hear</h2>
        <ul>
          <li>Tempo syncs with your vehicle speed</li>
          <li>Mood shifts at transfers and delays</li>
          <li>A finale that lands exactly at arrival</li>
        </ul>
      </section>
    </main>
  );
}
