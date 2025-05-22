import React from "react";
import { Link } from 'react-router-dom';
import { FormattedMessage } from 'react-intl';

const Footer = () => {
    return (
        <div className="footer">
        <footer className="text-center text-white bg-secondary p-1">
                <section className="mt-2">
                    <div className="row text-center d-flex justify-content-center pt-3">
                        <div className="col-md-2">
                            <h6 className="text-uppercase font-weight-bold">
                                <Link className="text-white" to="/about_us">
                                    <FormattedMessage id="project.About_Us" />
                                </Link>
                            </h6>
                        </div>
                        <div className="col-md-2">
                            <h6 className="text-uppercase font-weight-bold">
                                <Link className="text-white" to="/contact">
                                    <FormattedMessage id="project.Contact" />
                                </Link>
                            </h6>
                        </div>
                    </div>
                </section>
                <hr className="my-2" />
                <section className="mb-2">
                    <div className="row d-flex justify-content-center">
                        <div className="col-lg-8">
                            <p>
                                <FormattedMessage id="project.Footer" />
                            </p>
                        </div>
                    </div>
                </section>
        </footer>
        </div>
    );
};

export default Footer;