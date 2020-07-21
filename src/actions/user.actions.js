import { alertActions } from "./";
import config from "config";
import { userConstants } from "../constants";
import fleekStorage from "@fleekhq/fleek-storage-js";
import {
    daemonService,
    marketService,
    erc20Service,
    ipldService,
    keysService
} from "../services";

export const userActions = {
    clean,
    getFile,
    getAllFiles,
    getPriceLimit,
    getFileCount,
    buy,
    uploadImage,
    downloadFile,
    uploadAndSellFile
};

function clean() {
    return dispatch => {
        dispatch({
            type: userConstants.CLEAN
        });
    };
}

function getFile(fileId) {
    return async (dispatch, getState) => {
        dispatch(started());
        let file;
        try {
            const { account, market } = getState().web3;
            file = await marketService.getFile(market, fileId);
        } catch (e) {
            console.log(e);
            dispatch(failure(e));
            dispatch(alertActions.error("Error Getting File"));
            return;
        }
        dispatch(result({ data: { file } }));

        return file;
    };
}

function getFileCount() {
    return async (dispatch, getState) => {
        dispatch(started());
        let fileCount;
        try {
            const { account, market } = getState().web3;
            fileCount = await marketService.getFileCount(market);
        } catch (e) {
            console.log(e);
            dispatch(failure(e));
            dispatch(alertActions.error("Error Getting FileCount"));
            return;
        }
        dispatch(result({ data: { fileCount } }));

        return fileCount;
    };
}

function getPriceLimit() {
    return async (dispatch, getState) => {
        dispatch(started());
        let priceLimit;
        try {
            const { account, market } = getState().web3;
            priceLimit = await marketService.getPriceLimit(market);
        } catch (e) {
            console.log(e);
            dispatch(failure(e));
            dispatch(alertActions.error("Error Getting PriceLimit"));
            return;
        }
        dispatch(result({ data: { priceLimit } }));

        return priceLimit;
    };
}

function getAllFiles() {
    return async (dispatch, getState) => {
        dispatch(started());
        let allFiles;
        try {
            const { account, market } = getState().web3;
            allFiles = await marketService.getAllFiles(market);
        } catch (e) {
            console.log(e);
            dispatch(failure(e));
            dispatch(alertActions.error("Error Getting All Files"));
            return;
        }
        dispatch(result({ data: { allFiles } }));

        return allFiles;
    };
}

function uploadAndSellFile(path, description, imageHash, price) {
    return async (dispatch, getState) => {
        dispatch(started());
        try {
            const { account, market, web3 } = getState().web3;
            const priceLimit = await marketService.getPriceLimit(market);
            if (parseInt(price) > parseInt(priceLimit)) {
                throw "Price higher than priceLimit (" + priceLimit + " DAI)";
            }

            const bucketName = account + "." + Date.now();
            const fileName = path.replace(/^.*[\\\/]/, "");

            await daemonService.createBucket(bucketName);
            await daemonService.uploadFile(bucketName, path);
            const threadInfo = await daemonService.shareBucket(bucketName);
            const metadataHash = await ipldService.uploadMetadata({
                fileName,
                bucketName,
                description,
                imageHash
            });

            await marketService.sell(
                market,
                config.testnetDAIAddress,
                price,
                metadataHash
            );

            console.log("sign metadataHash");
            const signature = web3.eth.sign(metadataHash, account);

            await keysService.putThreadData(metadataHash, {
                threadInfo,
                bucketName,
                signature
            });
        } catch (error) {
            console.log({error});
            dispatch(failure(error));
            dispatch(alertActions.error("Error Selling File"));
            return;
        }
        dispatch(alertActions.success("Successfully Sold File"));
        dispatch(done());
    };
}

function buy(fileId) {
    return async (dispatch, getState) => {
        dispatch(started());
        let data;
        try {
            const { account, market, dai } = getState().web3;
            const file = await marketService.getFile(market, fileId);
            data = await erc20Service.approve(
                dai,
                config.marketAddress,
                file.price
            );
            if (data.error) {
                throw "Could not approve Market to transfer DAI";
            }
            data = await marketService.buy(market, fileId);
        } catch (e) {
            console.log(e);
            dispatch(failure(e));
            dispatch(alertActions.error("Error Buying File: " + e.toString()));
            return;
        }
        if (!data.error) {
            dispatch(alertActions.success("Successfully Bought File"));
            dispatch(done());
        } else {
            dispatch(failure(data.error));
            dispatch(alertActions.error("Error Buying File: " + data.error));
        }
    };
}

function downloadFile(metadataHash) {
    return async (dispatch, getState) => {
        dispatch(started());
        try {
            const { account, market, dai } = getState().web3;
            const threadData = await keysService.getThreadData(metadataHash);
            console.log({ threadData });
            await daemonService.joinBucket(
                threadData.bucketName,
                threadData.threadInfo
            );
            const location = await daemonService.openFile(
                threadData.bucketName
            );
        } catch (error) {
            console.log({ error });
            dispatch(failure(error));
            return;
        }
        dispatch(done());
    };
}

function uploadImage(file) {
    return async (dispatch, getState) => {
        dispatch(started());
        let imageHash;
        try {
            const uploadedFile = await fleekStorage.upload({
                apiKey: "9cILwykg8eJ7JifGfuS4zA==",
                apiSecret: "u1gcUczk4+o3B0XBP2A0DcWABEvDqUdxz06MgXc3FRA=",
                key: file.name,
                data: file
            });
            imageHash = uploadedFile.hash;
        } catch (error) {
            console.log({ error });
            dispatch(failure(error));
            return;
        }
        dispatch(done());
        return imageHash;
    };
}

function started() {
    return {
        type: userConstants.STARTED
    };
}

function done() {
    return {
        type: userConstants.DONE
    };
}

function cleanSelected(result) {
    return {
        type: userConstants.CLEAN_SELECTED,
        ...result
    };
}

function result(result) {
    return {
        type: userConstants.RESULT,
        ...result
    };
}

function failure(error) {
    return {
        type: userConstants.ERROR,
        error
    };
}
