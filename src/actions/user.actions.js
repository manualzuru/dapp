import { alertActions } from "./";
import config from "config";
import { userConstants } from "../constants";
import IERC20 from "../assets/abis/IERC20.json";
import {
    daemonService,
    marketService,
    erc20Service,
    ipfsService,
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

function uploadAndSellFile(path, metadata, price, priceAddress) {
    return async (dispatch, getState) => {
        dispatch(started());
        try {
            const { account, market, web3 } = getState().web3;
            const priceLimit = await marketService.getPriceLimit(market);
            if (parseInt(price) >= parseInt(priceLimit)) {
                throw `Price must be lower than priceLimit (${priceLimit})`;
            }

            const bucket = `bucket_${account}_${Date.now()}`;
            const file = path.replace(/^.*[\\\/]/, "");
            console.log({ bucket });

            const threadInfo = await daemonService.uploadFile(bucket, path);

            console.log({ threadInfo });
            const metadataHash = await ipfsService.uploadMetadata({
                ...metadata,
                file,
                bucket
            });
            console.log("got metadataHash");

            console.log({ metadataHash });

            const fileId = await marketService.sell(
                market,
                priceAddress,
                price,
                metadataHash
            );
            console.log("file sold on market");

            const signature = await web3.eth.personal.sign(fileId, account);
            console.log("fileId signed");
            console.log({ signature });

            await keysService.putThreadData(fileId, {
                threadInfo,
                bucket,
                signature
            });
            console.log("thread data uploaded");
        } catch (error) {
            console.log({ error });
            dispatch(failure(error));
            dispatch(alertActions.error(`Error Selling File: ${error}`));
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
            const { account, market } = getState().web3;
            const file = await marketService.getFile(market, fileId);
            const erc20 = await new web3.eth.Contract(
                IERC20["abi"],
                file.paymentAsset,
                { from: account }
            );
            data = await erc20Service.approve(
                erc20,
                config.marketAddress,
                file.price
            );
            if (data.error) {
                throw "Could not approve Market to transfer funds";
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

function downloadFile(fileId) {
    return async (dispatch, getState) => {
        dispatch(started());
        try {
            const { account, web3 } = getState().web3;
            console.log("sign fileId");
            const signature = await web3.eth.personal.sign(
                fileId.toString(),
                account
            );
            console.log({ signature });
            const threadData = await keysService.getThreadData(
                fileId,
                signature
            );
            console.log({ threadData });
            const location = await daemonService.openFile(
                threadData.bucket,
                threadData.threadInfo
            );
            console.log({ location });
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
            imageHash = await ipfsService.uploadFile(file);
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
