import "../styles/Dashboard.css";


function Dashboard() {
  const services = [
    {
      title: "Graphic Designer",
      price: "R350",
      category: "Design",
      location: "Johannesburg",
    },
    {
      title: "Web Developer",
      price: "R850",
      category: "Development",
      location: "Pretoria",
    },
    {
      title: "Math Tutor",
      price: "R250",
      category: "Education",
      location: "Polokwane",
    },
    {
      title: "Photographer",
      price: "R600",
      category: "Photography",
      location: "Cape Town",
    },
  ];

  return (
    <div className="dashboard">

      {/* Welcome Banner */}
      <section className="welcome-card">
        <h1>Welcome back, Hustler 👋</h1>
        <p>Discover opportunities, manage your services, and grow your business.</p>

        <button className="post-btn">+ Post a Service</button>
      </section>

      {/* Stats */}
      <section className="stats-grid">
        <div className="stat-card">
          <h2>12</h2>
          <p>Active Jobs</p>
        </div>

        <div className="stat-card">
          <h2>5</h2>
          <p>Messages</p>
        </div>

        <div className="stat-card">
          <h2>R4,800</h2>
          <p>Earnings This Month</p>
        </div>

        <div className="stat-card">
          <h2>18</h2>
          <p>Completed Projects</p>
        </div>
      </section>

      {/* Featured Services */}
      <section className="services-section">
        <div className="section-header">
          <h2>Featured Freelancers</h2>
        </div>

        <div className="service-grid">
          {services.map((service, index) => (
            <div key={index} className="service-card">
              <span className="badge">{service.category}</span>

              <h3>{service.title}</h3>

              <p className="location">📍 {service.location}</p>

              <h4>{service.price}/hour</h4>

              <button>Hire Now</button>
            </div>
          ))}
        </div>
      </section>

      {/* Quick Actions */}
      <section className="actions-section">
        <h2>Quick Actions</h2>

        <div className="actions-grid">
          <div className="action-card">
            <h3>📝 Edit Profile</h3>
            <p>Update your skills, bio, and contact information.</p>
          </div>

          <div className="action-card">
            <h3>📦 My Services</h3>
            <p>Manage services you've listed on HustleHub+.</p>
          </div>

          <div className="action-card">
            <h3>💬 Messages</h3>
            <p>Chat with clients and freelancers.</p>
          </div>

          <div className="action-card">
            <h3>💳 Payments</h3>
            <p>Track your earnings and withdrawals.</p>
          </div>
        </div>
      </section>

    </div>
  );
}

export default Dashboard;