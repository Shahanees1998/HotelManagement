"use client";
import React from "react";
import { InputText } from "primereact/inputtext";
import { Button } from "primereact/button";

const AuthFooter = () => {
    return (
        <footer style={{
            backgroundColor: "#1e3a5f",
            color: "#ffffff",
            padding: "3rem 2rem 1.5rem",
            marginTop: "auto",
            position:'relative'
        }}>
            <div style={{
                maxWidth: "1200px",
                margin: "0 auto",
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                gap: "2.5rem",
                marginBottom: "2rem"
            }}>
                {/* C-Reviews Column */}
                <div>
                    <h3 style={{
                        fontSize: "1.5rem",
                        fontWeight: "600",
                        marginBottom: "1rem",
                        color: "#ffffff"
                    }}>
                        C-Reviews
                    </h3>
                    <p style={{
                        fontSize: "0.875rem",
                        lineHeight: "1.6",
                        color: "#cbd5e1",
                        marginBottom: "0"
                    }}>
                        We help hotels connect with their guests through seamless feedback solutions. Our platform makes it easy to create forms, gather insights, and elevate the guest experience with integrity and professionalism at the core of everything we do.
                    </p>
                </div>

                {/* Quick Links Column */}
                <div>
                    <h4 style={{
                        fontSize: "1.125rem",
                        fontWeight: "600",
                        marginBottom: "1rem",
                        color: "#ffffff"
                    }}>
                        Quick Links
                    </h4>
                    <ul style={{
                        listStyle: "none",
                        padding: 0,
                        margin: 0
                    }}>
                        <li style={{ marginBottom: "0.75rem" }}>
                            <a href="/" style={{
                                color: "#cbd5e1",
                                textDecoration: "none",
                                fontSize: "0.875rem",
                                transition: "color 0.2s"
                            }}
                            onMouseOver={(e) => e.currentTarget.style.color = "#ffffff"}
                            onMouseOut={(e) => e.currentTarget.style.color = "#cbd5e1"}>
                                Home
                            </a>
                        </li>
                        <li style={{ marginBottom: "0.75rem" }}>
                            <a href="/about" style={{
                                color: "#cbd5e1",
                                textDecoration: "none",
                                fontSize: "0.875rem",
                                transition: "color 0.2s"
                            }}
                            onMouseOver={(e) => e.currentTarget.style.color = "#ffffff"}
                            onMouseOut={(e) => e.currentTarget.style.color = "#cbd5e1"}>
                                About Us
                            </a>
                        </li>
                        <li style={{ marginBottom: "0.75rem" }}>
                            <a href="/features" style={{
                                color: "#cbd5e1",
                                textDecoration: "none",
                                fontSize: "0.875rem",
                                transition: "color 0.2s"
                            }}
                            onMouseOver={(e) => e.currentTarget.style.color = "#ffffff"}
                            onMouseOut={(e) => e.currentTarget.style.color = "#cbd5e1"}>
                                Features
                            </a>
                        </li>
                        <li style={{ marginBottom: "0.75rem" }}>
                            <a href="/contact" style={{
                                color: "#cbd5e1",
                                textDecoration: "none",
                                fontSize: "0.875rem",
                                transition: "color 0.2s"
                            }}
                            onMouseOver={(e) => e.currentTarget.style.color = "#ffffff"}
                            onMouseOut={(e) => e.currentTarget.style.color = "#cbd5e1"}>
                                Contact Us
                            </a>
                        </li>
                    </ul>
                </div>

                {/* Resources Column */}
                <div>
                    <h4 style={{
                        fontSize: "1.125rem",
                        fontWeight: "600",
                        marginBottom: "1rem",
                        color: "#ffffff"
                    }}>
                        Resources
                    </h4>
                    <ul style={{
                        listStyle: "none",
                        padding: 0,
                        margin: 0
                    }}>
                        <li style={{ marginBottom: "0.75rem" }}>
                            <a href="/dashboard" style={{
                                color: "#cbd5e1",
                                textDecoration: "none",
                                fontSize: "0.875rem",
                                transition: "color 0.2s"
                            }}
                            onMouseOver={(e) => e.currentTarget.style.color = "#ffffff"}
                            onMouseOut={(e) => e.currentTarget.style.color = "#cbd5e1"}>
                                Dashboard
                            </a>
                        </li>
                        <li style={{ marginBottom: "0.75rem" }}>
                            <a href="/feedbacks" style={{
                                color: "#cbd5e1",
                                textDecoration: "none",
                                fontSize: "0.875rem",
                                transition: "color 0.2s"
                            }}
                            onMouseOver={(e) => e.currentTarget.style.color = "#ffffff"}
                            onMouseOut={(e) => e.currentTarget.style.color = "#cbd5e1"}>
                                Feedbacks
                            </a>
                        </li>
                        <li style={{ marginBottom: "0.75rem" }}>
                            <a href="/hotel-profile" style={{
                                color: "#cbd5e1",
                                textDecoration: "none",
                                fontSize: "0.875rem",
                                transition: "color 0.2s"
                            }}
                            onMouseOver={(e) => e.currentTarget.style.color = "#ffffff"}
                            onMouseOut={(e) => e.currentTarget.style.color = "#cbd5e1"}>
                                Hotel Profile
                            </a>
                        </li>
                        <li style={{ marginBottom: "0.75rem" }}>
                            <a href="/support" style={{
                                color: "#cbd5e1",
                                textDecoration: "none",
                                fontSize: "0.875rem",
                                transition: "color 0.2s"
                            }}
                            onMouseOver={(e) => e.currentTarget.style.color = "#ffffff"}
                            onMouseOut={(e) => e.currentTarget.style.color = "#cbd5e1"}>
                                Support
                            </a>
                        </li>
                        <li style={{ marginBottom: "0.75rem" }}>
                            <a href="/owner-profile" style={{
                                color: "#cbd5e1",
                                textDecoration: "none",
                                fontSize: "0.875rem",
                                transition: "color 0.2s"
                            }}
                            onMouseOver={(e) => e.currentTarget.style.color = "#ffffff"}
                            onMouseOut={(e) => e.currentTarget.style.color = "#cbd5e1"}>
                                Owner Profile
                            </a>
                        </li>
                    </ul>
                </div>

                {/* Legal Column */}
                <div>
                    <h4 style={{
                        fontSize: "1.125rem",
                        fontWeight: "600",
                        marginBottom: "1rem",
                        color: "#ffffff"
                    }}>
                        Legal
                    </h4>
                    <ul style={{
                        listStyle: "none",
                        padding: 0,
                        margin: 0,
                        marginBottom: "1.5rem"
                    }}>
                        <li style={{ marginBottom: "0.75rem" }}>
                            <a href="/privacy-policy" style={{
                                color: "#cbd5e1",
                                textDecoration: "none",
                                fontSize: "0.875rem",
                                transition: "color 0.2s"
                            }}
                            onMouseOver={(e) => e.currentTarget.style.color = "#ffffff"}
                            onMouseOut={(e) => e.currentTarget.style.color = "#cbd5e1"}>
                                Privacy Policy
                            </a>
                        </li>
                        <li style={{ marginBottom: "0.75rem" }}>
                            <a href="/company-policy" style={{
                                color: "#cbd5e1",
                                textDecoration: "none",
                                fontSize: "0.875rem",
                                transition: "color 0.2s"
                            }}
                            onMouseOver={(e) => e.currentTarget.style.color = "#ffffff"}
                            onMouseOut={(e) => e.currentTarget.style.color = "#cbd5e1"}>
                                Company Policy
                            </a>
                        </li>
                        <li style={{ marginBottom: "0.75rem" }}>
                            <a href="/terms" style={{
                                color: "#cbd5e1",
                                textDecoration: "none",
                                fontSize: "0.875rem",
                                transition: "color 0.2s"
                            }}
                            onMouseOver={(e) => e.currentTarget.style.color = "#ffffff"}
                            onMouseOut={(e) => e.currentTarget.style.color = "#cbd5e1"}>
                                Terms & Conditions
                            </a>
                        </li>
                    </ul>

                    {/* Connect with Us */}
                    <div>
                        <h4 style={{
                            fontSize: "1.125rem",
                            fontWeight: "600",
                            marginBottom: "1rem",
                            color: "#ffffff"
                        }}>
                            Connect with Us
                        </h4>
                        <div style={{
                            display: "flex",
                            gap: "0.5rem",
                            marginBottom: "1rem"
                        }}>
                            <InputText
                                placeholder="Email Address"
                                style={{
                                    flex: 1,
                                    fontSize: "0.875rem",
                                    padding: "0.625rem 0.75rem",
                                    borderRadius: "4px",
                                    border: "1px solid #cbd5e1",
                                    backgroundColor: "#ffffff"
                                }}
                            />
                            <Button
                                icon="pi pi-arrow-right"
                                style={{
                                    padding: "0.625rem 1rem",
                                    backgroundColor: "#ffffff",
                                    color: "#1e3a5f",
                                    border: "none",
                                    borderRadius: "4px"
                                }}
                            />
                        </div>
                        <div style={{
                            display: "flex",
                            gap: "0.75rem"
                        }}>
                            <a
                                href="https://facebook.com"
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{
                                    width: "36px",
                                    height: "36px",
                                    borderRadius: "50%",
                                    backgroundColor: "#ffffff",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    color: "#1e3a5f",
                                    textDecoration: "none",
                                    transition: "transform 0.2s"
                                }}
                                onMouseOver={(e) => e.currentTarget.style.transform = "scale(1.1)"}
                                onMouseOut={(e) => e.currentTarget.style.transform = "scale(1)"}
                            >
                                <i className="pi pi-facebook" style={{ fontSize: "1.125rem" }}></i>
                            </a>
                            <a
                                href="https://instagram.com"
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{
                                    width: "36px",
                                    height: "36px",
                                    borderRadius: "50%",
                                    backgroundColor: "#ffffff",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    color: "#1e3a5f",
                                    textDecoration: "none",
                                    transition: "transform 0.2s"
                                }}
                                onMouseOver={(e) => e.currentTarget.style.transform = "scale(1.1)"}
                                onMouseOut={(e) => e.currentTarget.style.transform = "scale(1)"}
                            >
                                <i className="pi pi-instagram" style={{ fontSize: "1.125rem" }}></i>
                            </a>
                            <a
                                href="https://linkedin.com"
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{
                                    width: "36px",
                                    height: "36px",
                                    borderRadius: "50%",
                                    backgroundColor: "#ffffff",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    color: "#1e3a5f",
                                    textDecoration: "none",
                                    transition: "transform 0.2s"
                                }}
                                onMouseOver={(e) => e.currentTarget.style.transform = "scale(1.1)"}
                                onMouseOut={(e) => e.currentTarget.style.transform = "scale(1)"}
                            >
                                <i className="pi pi-linkedin" style={{ fontSize: "1.125rem" }}></i>
                            </a>
                        </div>
                    </div>
                </div>
            </div>

            {/* Copyright */}
            <div style={{
                textAlign: "center",
                paddingTop: "1.5rem",
                borderTop: "1px solid rgba(255, 255, 255, 0.1)",
                color: "#cbd5e1",
                fontSize: "0.875rem"
            }}>
                © 2024 C-Reviews LLC. All Rights Reserved!
            </div>
            <img src="/images/footer.svg" alt="C-Reviews" style={{ width: "100%", position:'absolute', bottom: 0, left: 0 }} />
        </footer>
    );
};

export default AuthFooter;

