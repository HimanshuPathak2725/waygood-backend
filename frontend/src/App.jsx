import InfoCard from "./components/InfoCard.jsx";
import SignalStrip from "./components/SignalStrip.jsx";
import SpotlightList from "./components/SpotlightList.jsx";
import {
  assignmentSignals,
  featureCards,
  productSignals,
  universitySpotlights,
} from "./data/sampleData.js";

export default function App() {
  return (
    <main className="page-shell">
      <section className="hero">
        <div className="hero-copy">
          <p className="eyebrow">Waygood Candidate Evaluation Starter</p>
          <h1>Build the backend for a study-abroad platform that feels real.</h1>
          <p className="hero-text">
            This starter is shaped around student discovery, counselor workflows,
            and practical backend engineering. Candidates can extend the
            experience with stronger APIs, recommendations, caching, and better
            application lifecycle management.
          </p>
        </div>
        <div className="hero-panel">
          <p className="panel-label">Starter outcomes</p>
          <ul>
            {assignmentSignals.map((signal) => (
              <li key={signal}>{signal}</li>
            ))}
          </ul>
        </div>
      </section>

      <SignalStrip items={productSignals} />

      <section className="section">
        <div className="section-heading">
          <p className="eyebrow">Product direction</p>
          <h2>Waygood-style platform areas reflected in the starter</h2>
        </div>
        <div className="card-grid">
          {featureCards.map((card) => (
            <InfoCard key={card.title} title={card.title} body={card.body} />
          ))}
        </div>
      </section>

      <section className="section">
        <div className="section-heading">
          <p className="eyebrow">Sample destinations</p>
          <h2>University examples seeded into the backend</h2>
        </div>
        <SpotlightList items={universitySpotlights} />
      </section>

      <section className="section closing-note">
        <p className="eyebrow">Candidate note</p>
        <h2>The assignment brief lives in the root README and Word document.</h2>
        <p>
          Treat this frontend as context, not a constraint. If your backend
          choices require different response shapes or better UX flows, update
          the client accordingly and explain why.
        </p>
      </section>
    </main>
  );
}
