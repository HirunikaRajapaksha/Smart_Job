import { useState, useMemo } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "./JobMap.css";
import { MapPin, Briefcase, Building, Send, Eye, Search, Lock } from "lucide-react";

const CITY_COORDS = {
  colombo: [6.9271, 79.8612],
  kandy: [7.2906, 80.6337],
  galle: [6.0535, 80.221],
  gampaha: [7.084, 79.9943],
  jaffna: [9.6615, 80.0255],
  kurunegala: [7.4863, 80.3623],
  matara: [5.9549, 80.555],
  negombo: [7.2008, 79.8736],
  anuradhapura: [8.3114, 80.4037],
  batticaloa: [7.731, 81.6747],
  ratnapura: [6.6828, 80.4035],
  badulla: [6.9934, 81.055],
  matale: [7.4675, 80.6234],
  nuwaraeliya: [6.9497, 80.7891],
  trincomalee: [8.5874, 81.2152],
  kalutara: [6.5854, 79.9607],
  kegalle: [7.2513, 80.3464],
  hambantota: [6.1429, 81.1212],
  polonnaruwa: [7.9403, 81.0188],
  dehiwala: [6.8511, 79.8659],
  moratuwa: [6.773, 79.8816],
  maharagama: [6.848, 79.9265],
  nugegoda: [6.8649, 79.8997]
};

const defaultFallbackJobs = [
  {
    id: "sample-1",
    jobName: "Full Stack Web Developer",
    company: "Virtusa Sri Lanka",
    location: "Colombo",
    salary: 160000,
    jobType: "Full-time",
    category: "Technology",
    description: "Looking for a skilled developer proficient in React, Node.js, and MongoDB.",
  },
  {
    id: "sample-2",
    jobName: "UI/UX Product Designer",
    company: "Creative Lanka Tech",
    location: "Kandy",
    salary: 110000,
    jobType: "Full-time",
    category: "Design",
    description: "Design mobile apps and web platforms using Figma and modern design systems.",
  },
  {
    id: "sample-3",
    jobName: "Digital Marketing Specialist",
    company: "Southern Media Works",
    location: "Galle",
    salary: 85000,
    jobType: "Remote",
    category: "Marketing",
    description: "Lead SEO, PPC, and social media campaigns for international clients.",
  },
  {
    id: "sample-4",
    jobName: "Junior Software Engineer",
    company: "Gampaha Tech Hub",
    location: "Gampaha",
    salary: 95000,
    jobType: "Full-time",
    category: "Technology",
    description: "Develop REST APIs and assist in client integrations with modern JavaScript.",
  },
  {
    id: "sample-5",
    jobName: "Accounts Executive",
    company: "Wayamba Trading Ltd",
    location: "Kurunegala",
    salary: 75000,
    jobType: "Full-time",
    category: "Finance",
    description: "Manage accounts payable/receivable, financial statements and VAT filings.",
  }
];

const customJobMarker = L.divIcon({
  className: "custom-job-marker",
  html: '<div class="marker-pulse"><div class="marker-core"><span class="marker-icon">💼</span></div></div>',
  iconSize: [40, 40],
  iconAnchor: [20, 20],
  popupAnchor: [0, -22],
});

function MapUpdater({ selectedLocation }) {
  const map = useMap();

  if (selectedLocation) {
    map.flyTo(selectedLocation, 11, { duration: 1.2 });
  }

  return null;
}

function getCoordsForLocation(locName, index = 0) {
  if (!locName) return [6.9271, 79.8612];
  const clean = locName.toLowerCase().replace(/[^a-z]/g, "");

  for (const [city, coords] of Object.entries(CITY_COORDS)) {
    if (clean.includes(city) || city.includes(clean)) {
      const offsetLat = (index % 4) * 0.008 - 0.012;
      const offsetLng = (index % 3) * 0.008 - 0.008;
      return [coords[0] + offsetLat, coords[1] + offsetLng];
    }
  }

  // Default Colombo with index offset
  return [6.9271 + ((index % 5) * 0.012), 79.8612 + ((index % 5) * 0.012)];
}

const POPULAR_CITIES = ["All locations", "Colombo", "Kandy", "Galle", "Gampaha", "Kurunegala", "Jaffna", "Negombo"];

function JobMap({ jobs = [], onApplyJob, onViewDetails, userRole = "job_seeker", isLoggedIn = false }) {
  const [selectedCity, setSelectedCity] = useState("All locations");
  const [mapSearch, setMapSearch] = useState("");
  const [selectedJob, setSelectedJob] = useState(null);

  // Map backend jobs to map items
  const mappedJobs = useMemo(() => {
    const rawList = jobs && jobs.length > 0 ? jobs : defaultFallbackJobs;

    return rawList.map((job, idx) => ({
      ...job,
      id: job._id || job.id || `job-${idx}`,
      title: job.jobName || job.title || "Job Position",
      company: job.company || "Company not specified",
      location: job.location || "Colombo",
      salaryDisplay: typeof job.salary === "number"
        ? `Rs. ${job.salary.toLocaleString()}`
        : (job.salary || "Negotiable"),
      position: getCoordsForLocation(job.location, idx),
    }));
  }, [jobs]);

  // Unique locations list from database
  const availableLocations = useMemo(() => {
    const locSet = new Set(["All locations"]);
    mappedJobs.forEach((j) => {
      if (j.location) {
        locSet.add(j.location.trim());
      }
    });
    return Array.from(locSet);
  }, [mappedJobs]);

  // Filter jobs by city and search term
  const filteredJobs = useMemo(() => {
    return mappedJobs.filter((job) => {
      const matchCity =
        selectedCity === "All locations" ||
        job.location.toLowerCase().includes(selectedCity.toLowerCase()) ||
        selectedCity.toLowerCase().includes(job.location.toLowerCase());

      const matchSearch =
        !mapSearch.trim() ||
        job.title.toLowerCase().includes(mapSearch.toLowerCase()) ||
        job.company.toLowerCase().includes(mapSearch.toLowerCase()) ||
        job.location.toLowerCase().includes(mapSearch.toLowerCase());

      return matchCity && matchSearch;
    });
  }, [mappedJobs, selectedCity, mapSearch]);

  const selectedLocation = useMemo(() => {
    if (selectedCity === "All locations") {
      return [7.8731, 80.7718]; // Center of Sri Lanka
    }
    const match = mappedJobs.find((job) =>
      job.location.toLowerCase().includes(selectedCity.toLowerCase())
    );
    if (match) return match.position;

    const clean = selectedCity.toLowerCase().replace(/[^a-z]/g, "");
    if (CITY_COORDS[clean]) return CITY_COORDS[clean];

    return [7.8731, 80.7718];
  }, [selectedCity, mappedJobs]);

  return (
    <section className="job-map-section" id="job-map">
      <div className="map-heading-wrapper">
        <div className="map-heading-content">
          <span className="section-pill">
            <MapPin size={14} /> SRI LANKA VACANCY MAP
          </span>
          <h2>Explore Jobs Across Sri Lanka</h2>
          <p>
            Find vacancies located in your city or district. Click markers on the map to inspect job details and apply immediately.
          </p>
        </div>

        {/* Quick city chips */}
        <div className="map-city-chips">
          {POPULAR_CITIES.map((city) => (
            <button
              key={city}
              type="button"
              className={`city-chip ${selectedCity.toLowerCase() === city.toLowerCase() ? "active" : ""}`}
              onClick={() => {
                setSelectedCity(city);
                setSelectedJob(null);
              }}
            >
              {city}
            </button>
          ))}
        </div>
      </div>

      <div className="map-layout">
        {/* Map Sidebar */}
        <aside className="map-sidebar">
          <div className="sidebar-filter-header">
            <div className="search-input-wrap">
              <Search size={15} />
              <input
                type="text"
                placeholder="Filter by city, title, or company..."
                value={mapSearch}
                onChange={(e) => setMapSearch(e.target.value)}
              />
              {mapSearch && (
                <button
                  type="button"
                  className="clear-search-btn"
                  onClick={() => setMapSearch("")}
                >
                  ×
                </button>
              )}
            </div>

            <div className="location-select-wrap">
              <select
                id="job-location-select"
                value={selectedCity}
                onChange={(e) => {
                  setSelectedCity(e.target.value);
                  setSelectedJob(null);
                }}
              >
                {availableLocations.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="map-result-count">
            <span>Openings in {selectedCity}:</span>
            <span className="count-badge">{filteredJobs.length}</span>
          </div>

          <div className="map-job-list">
            {filteredJobs.map((job) => (
              <div
                key={job.id}
                className={`map-job-card ${selectedJob?.id === job.id ? "active" : ""}`}
                onClick={() => setSelectedJob(job)}
              >
                <div className="map-job-card-top">
                  <div className="map-job-avatar">
                    {(job.company || "C").charAt(0).toUpperCase()}
                  </div>
                  <div className="map-job-main-info">
                    <h4>{job.title}</h4>
                    <span className="map-job-company">{job.company}</span>
                  </div>
                </div>

                <div className="map-job-tags">
                  <span className="tag-loc">
                    <MapPin size={12} /> {job.location}
                  </span>
                  <span className="tag-sal">
                    {job.salaryDisplay}
                  </span>
                  <span className="tag-type">
                    {job.jobType || "Full-time"}
                  </span>
                </div>

                <div className="map-job-card-actions">
                  <button
                    type="button"
                    className="map-btn-apply"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (onApplyJob) onApplyJob(job);
                    }}
                    title={!isLoggedIn ? "Please log in to apply for this vacancy" : "Apply Now"}
                  >
                    {!isLoggedIn ? <Lock size={12} /> : <Send size={13} />}
                    {!isLoggedIn ? "Login to Apply" : "Apply Now"}
                  </button>
                  <button
                    type="button"
                    className="map-btn-details"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (onViewDetails) onViewDetails(job);
                      else setSelectedJob(job);
                    }}
                  >
                    <Eye size={13} /> View
                  </button>
                </div>
              </div>
            ))}

            {filteredJobs.length === 0 && (
              <div className="map-empty-state">
                <MapPin size={32} />
                <p>No job vacancies found for "{selectedCity}".</p>
                <button
                  type="button"
                  className="reset-city-btn"
                  onClick={() => {
                    setSelectedCity("All locations");
                    setMapSearch("");
                  }}
                >
                  View all locations
                </button>
              </div>
            )}
          </div>

          <div className="map-sidebar-footer">
            <span className="live-dot"></span>
            <span>Live data connected to MongoDB database</span>
          </div>
        </aside>

        {/* Map Canvas */}
        <div className="map-canvas-container">
          <MapContainer
            center={[7.8731, 80.7718]}
            zoom={8}
            scrollWheelZoom={true}
            className="leaflet-map"
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            <MapUpdater selectedLocation={selectedLocation} />

            {filteredJobs.map((job) => (
              <Marker
                key={job.id}
                position={job.position}
                icon={customJobMarker}
                eventHandlers={{
                  click: () => setSelectedJob(job),
                }}
              >
                <Popup>
                  <div className="map-custom-popup">
                    <div className="popup-badge">{job.category || "General"}</div>
                    <strong className="popup-title">{job.title}</strong>
                    <p className="popup-company">
                      <Building size={13} /> {job.company}
                    </p>
                    <p className="popup-loc">
                      <MapPin size={13} /> {job.location}, Sri Lanka
                    </p>
                    <div className="popup-salary">{job.salaryDisplay} / month</div>

                    <div className="popup-actions">
                      <button
                        type="button"
                        className="popup-apply-btn"
                        onClick={() => {
                          if (onApplyJob) onApplyJob(job);
                        }}
                        title={!isLoggedIn ? "Please log in to apply for this vacancy" : "Apply Now"}
                      >
                        {!isLoggedIn ? <Lock size={12} /> : <Send size={13} />}
                        {!isLoggedIn ? "Login to Apply" : "Apply Now"}
                      </button>
                      <button
                        type="button"
                        className="popup-details-btn"
                        onClick={() => {
                          if (onViewDetails) onViewDetails(job);
                          else setSelectedJob(job);
                        }}
                      >
                        Details
                      </button>
                    </div>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        </div>
      </div>

      {/* Selected Job Drawer Panel */}
      {selectedJob && (
        <div className="map-floating-drawer">
          <div className="drawer-header">
            <div className="drawer-title-group">
              <span className="section-pill">SELECTED VACANCY</span>
              <h3>{selectedJob.title}</h3>
              <p className="drawer-company">{selectedJob.company} • {selectedJob.location}, Sri Lanka</p>
            </div>
            <button
              className="drawer-close-btn"
              type="button"
              onClick={() => setSelectedJob(null)}
              aria-label="Close"
            >
              ×
            </button>
          </div>

          <div className="drawer-stats">
            <div className="drawer-stat">
              <span>Salary</span>
              <strong>{selectedJob.salaryDisplay}</strong>
            </div>
            <div className="drawer-stat">
              <span>Job Type</span>
              <strong>{selectedJob.jobType || "Full-time"}</strong>
            </div>
            <div className="drawer-stat">
              <span>Category</span>
              <strong>{selectedJob.category || "General"}</strong>
            </div>
          </div>

          {selectedJob.description && (
            <p className="drawer-description">{selectedJob.description}</p>
          )}

          <div className="drawer-actions">
            <button
              type="button"
              className="drawer-apply-btn"
              onClick={() => {
                if (onApplyJob) onApplyJob(selectedJob);
              }}
              title={!isLoggedIn ? "Please log in to apply for this vacancy" : "Apply for this Vacancy"}
            >
              {!isLoggedIn ? <Lock size={15} /> : <Send size={16} />}
              {!isLoggedIn ? "Login to Apply" : "Apply for this Vacancy"}
            </button>
            <button
              type="button"
              className="drawer-info-btn"
              onClick={() => {
                if (onViewDetails) onViewDetails(selectedJob);
              }}
            >
              <Eye size={16} /> View Full Overview
            </button>
          </div>
        </div>
      )}
    </section>
  );
}

export default JobMap;
