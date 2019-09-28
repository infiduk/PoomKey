const keyModel = require('../model/key');

// ExpressJS Setup
const express = require('express');
const keyRouter = express.Router();

// Hyperledger Bridge
const { FileSystemWallet, Gateway } = require('fabric-network');
const fs = require('fs');
const path = require('path');
const ccpPath = path.resolve(__dirname, '..', '..', 'network' ,'connection.json');
const ccpJSON = fs.readFileSync(ccpPath, 'utf8');
const ccp = JSON.parse(ccpJSON);

keyRouter.get('/key', (req, res)=>{
    res.render('registerKey');
});

// 새로운 키 등록
keyRouter.post('/key', async (req, res) => {
    try {
        /* 
            블록체인에 올라갈 Key Data
            {
                "index": "DB에 저장된 index"
                "key" : "제품키",
                "name" : "제품 이름",
                "owner" : "제품키 소유자",
                "validity" : "제품키 사용 가능 기간",
            }
        */
    /* ------------------- REQUESTED DATA -------------------- */
        var key = req.body.key;
        var name = req.body.name;
        var owner = req.body.owner;
        var validity = req.body.validity;
    /* ------------------- REQUESTED DATA -------------------- */

    /* ------------------- DATABASE ACCESS ------------------- */
        let keyData = { name, owner, validity }    
        let result = await keyModel.setKey(keyData);
        let id = result[0]['insertId'];
    /* ------------------- DATABASE ACCESS ------------------- */

    /* ------------------- CHAINCODE ACCESS ------------------ */
        const walletPath = path.join(process.cwd(), 'wallet');
        const wallet = new FileSystemWallet(walletPath);
        console.log(`Wallet path: ${walletPath}`);

        const userExists = await wallet.exists('user1');
        if (!userExists) {
            console.log('An identity for the user "user1" does not exist in the wallet');
            console.log('Run the registerUser.js application before retrying');
            return;
        }
        const gateway = new Gateway();
        await gateway.connect(ccp, { wallet, identity: 'user1', discovery: { enabled: false } }); 

        const network = await gateway.getNetwork('mychannel');

        const contract = network.getContract('sacc');

        await contract.submitTransaction("setKey", id.toString(), key.toString(), name, owner, validity);
        await gateway.disconnect();
        console.log("Transaction has been submitted")
    /* ------------------- CHAINCODE ACCESS ------------------ */
    
    /* ----------------------- RESPONSE ---------------------- */
        // res.status(200).json({response: 'Transaction has been submitted'});
        res.render('index')
    } catch (error) {
        console.error(`Failed to submit transaction: ${error}`);
        res.status(400).json(error);
    }
    /* ----------------------- RESPONSE ---------------------- */
});

// 모든 키 조회
keyRouter.get('/keys', async (req, res) => {
    try {
    /* ------------------- DATABASE ACCESS ------------------- */
        const db = await keyModel.getAllKeys();
    /* ------------------- DATABASE ACCESS ------------------- */
    
    /* ------------------- CHAINCODE ACCESS ------------------ */
        const walletPath = path.join(process.cwd(), 'wallet');
        const wallet = new FileSystemWallet(walletPath);
        console.log(`Wallet path: ${walletPath}`);
        const userExists = await wallet.exists('user1');

        if (!userExists) {
            console.log('An identity for the user "user1" does not exist in the wallet');
            console.log('Run the registerUser.js application before retrying');
            return;
        }

        const gateway = new Gateway();
        await gateway.connect(ccp, { wallet, identity: 'user1', discovery: { enabled: false } });
        const network = await gateway.getNetwork('mychannel');
        
        const contract = network.getContract('sacc');
        const result = await contract.evaluateTransaction('getAllKeys');
        console.log(`Transaction has been evaluated, result is: ${result.toString()}`);
        /* ------------------- CHAINCODE ACCESS ------------------ */
        var obj = JSON.parse(result);

        for(var i=0; i<obj.length; i++){
            obj[i]['poomId'] = parseInt(obj[i]['poomId'])
        }
        if(obj.length > 1) {
            obj.sort(function(a, b) { // 오름차순
                return a['poomId'] - b['poomId'];
                // 13, 21, 25, 44
            });
        }
        console.log(obj)
        res.render('queryAllKey', { data: obj });
    } catch(error) {
        console.error(`Failed: ${error}`);
        res.status(400).json(error);
    }
});

keyRouter.get('/keys/owner', (req, res) => {
    res.render('queryKey');
});

// Owner로 키 조회
keyRouter.post('/keys/owner', async (req, res) => {
    try {
        var owner = req.body.owner;
        console.log(owner);
    /* ------------------- DATABASE ACCESS ------------------- */
        let db = await keyModel.getKeysByOwner(owner);
    /* ------------------- DATABASE ACCESS ------------------- */

    /* ------------------- CHAINCODE ACCESS ------------------ */
        const walletPath = path.join(process.cwd(), 'wallet');
        const wallet = new FileSystemWallet(walletPath);
        console.log(`Wallet path: ${walletPath}`);
        const userExists = await wallet.exists('user1');
        if (!userExists) {
            console.log('An identity for the user "user1" does not exist in the wallet');
            console.log('Run the registerUser.js application before retrying');
            return;
        }
        const gateway = new Gateway();
        await gateway.connect(ccp, { wallet, identity: 'user1', discovery: { enabled: false } });
        const network = await gateway.getNetwork('mychannel');
        const contract = network.getContract('sacc');
        const result = await contract.evaluateTransaction('getAllKeys');
        console.log(`Transaction has been evaluated, result is: ${result.toString()}`);
        var obj = JSON.parse(result)
        console.log(obj[0]['owner'])
        for(var i = 0; i < obj.length; i++){
            if(owner != obj[i]['poomOwner']) {
                obj.splice(i, 1);
                i = i - 1;
                continue;
            }
            obj[i]['poomId'] = parseInt(obj[i]['poomId']);
        }
        if(obj.length > 1) {
            obj.sort(function(a, b) { // 오름차순
                return a['poomId'] - b['poomId'];
                // 13, 21, 25, 44
            });
        }
    /* ------------------- CHAINCODE ACCESS ------------------ */
        res.status(200).json(obj);
        // res.render('queryKey', { data: obj });
    } catch (error) {
        console.error(`Failed to evaluate transaction: ${error}`);
        res.status(400).json(`{response: ${error}`);
    }
});

// 키 소유권 변경
keyRouter.put('/key', async (req, res) => {
    try {
        var fromIndex = req.session.user.index;
        var toIndex = req.body.toIndex;
        var poomKeyIndex = req.body.poomKeyIndex;

        var dbKeyData = {
            owner : dbKeyData,
            keyIndex : poomKeyIndex
        }

        let index = await keyModel.changeKeyOwner(dbKeyData);
        index = index[0];
        console.log(index)
        const walletPath = path.join(process.cwd(), 'wallet');
        const wallet = new FileSystemWallet(walletPath);
        console.log(`Wallet path: ${walletPath}`);

        const userExists = await wallet.exists('user1');
        if (!userExists) {
            console.log('An identity for the user "user1" does not exist in the wallet');
            console.log('Run the registerUser.js application before retrying');
            return;
        }
        const gateway = new Gateway();
        await gateway.connect(ccp, { wallet, identity: 'user1', discovery: { enabled: false } });

        const network = await gateway.getNetwork('mychannel');

        const contract = network.getContract('sacc');
        await contract.submitTransaction('changeKeyOwner', poomKeyIndex, fromIndex, toIndex);
        await gateway.disconnect();
        res.status(200).json({response: 'Transaction has been submitted'});
    } catch (error) {
        console.error(`Failed to submit transaction: ${error}`);
        res.status(400).json(error);
    }
});

module.exports = keyRouter;