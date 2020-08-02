import React, { useState, useEffect } from "react";
import { connect } from "react-redux";
import { userActions } from "../actions";
import ProfileHover from "profile-hover";
import { history, getTokenSymbol } from "../helpers";
import "../assets/scss/detailsPage.scss";

const DetailsPage = ({
    match: {
        params: { fileId }
    },
    data: { file },
    connected,
    getFile,
    buy,
    downloadFile
}) => {
    const [location, setLocation] = useState("");

    useEffect(() => {
        if (connected && fileId) {
            getFile(parseInt(fileId));
            const location = localStorage.getItem(fileId);
            console.log({location});
            setLocation(location);
        }
    }, [fileId, connected]);

    return (
        <section className="filePage">
            {file && (
                <div className="fileItem" key={file.metadataHash}>
                    <div className="detailsLeftBar">
                        <img
                            className="fileImage"
                            src={`https://ipfs.infura.io/ipfs/${file.metadata.imageHash}`}
                        />
                        <a
                            className="buyButton button"
                            onClick={e => {
                                buy(fileId);
                            }}
                        >
                            Buy File
                        </a>
                        <a
                            className="downloadButton button"
                            onClick={async e => {
                                const location = await downloadFile(fileId);
                                localStorage.setItem(fileId, location);
                                setLocation(location);
                            }}
                        >
                            Download File
                        </a>
                    </div>
                    <div className="detailsRightBar">
                        <span className="label labelTitle">title</span>
                        <span className="fileTitle">{file.metadata.title}</span>
                        <span className="label">sold by</span>
                        <div
                            className="fileSellerContainer"
                            onClick={() => {
                                history.push(`/users/${file.seller}`);
                            }}
                        >
                            <ProfileHover
                                className="fileSeller"
                                address={file.seller}
                                orientation="bottom"
                                tileStyle
                            />
                        </div>
                        <span className="label">price</span>
                        <span className="filePrice">{`${
                            file.price
                        } ${getTokenSymbol(file.paymentAsset)}`}</span>
                        <span className="label">Number of buys</span>
                        <span className="fileBuys">
                            {`${file.numRetrievals}`}
                        </span>
                        <span className="label">upload date</span>
                        <span className="uploadDate">
                            {new Date(file.metadata.uploadDate).toString()}
                        </span>

                        <span className="label">description</span>
                        <span className="fileDescription">
                            {file.metadata.description}
                        </span>
                        {location && location != "undefined" && (
                            <>
                                <span className="label">
                                    local file location
                                </span>
                                <span className="fileDescription">
                                    {location}
                                </span>
                            </>
                        )}
                    </div>
                </div>
            )}
        </section>
    );
};

function mapState(state) {
    const { connected } = state.web3;
    const { data } = state.user;
    return { data, connected };
}

const actionCreators = {
    getFile: userActions.getFile,
    buy: userActions.buy,
    downloadFile: userActions.downloadFile
};

const connectedDetailsDisplay = connect(mapState, actionCreators)(DetailsPage);

export default connectedDetailsDisplay;
