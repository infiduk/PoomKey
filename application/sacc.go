/*
 * Copyright IBM Corp All Rights Reserved
 *
 * SPDX-License-Identifier: Apache-2.0
 */

package main

import (
	"encoding/json"
	"fmt"

	"github.com/hyperledger/fabric/core/chaincode/shim"
	"github.com/hyperledger/fabric/protos/peer"
)
 
// SimpleAsset implements a simple chaincode to manage an asset
type SimpleAsset struct {
}

type Data struct {
	Index		string `json:"index"`
	Key   		string `json:"key"`
	Name  		string `json:"name"`
	Owner		string `json:"owner"`
	Validity 	string `json:"validity"`
}
 
// Init is called during chaincode instantiation to initialize any
// data. Note that chaincode upgrade also calls this function to reset
// or to migrate data.
func (t *SimpleAsset) Init(stub shim.ChaincodeStubInterface) peer.Response {

	return shim.Success(nil)
}
 
// Invoke is called per transaction on the chaincode. Each transaction is
// either a 'get' or a 'set' on the asset created by Init function. The Set
// method may create a new asset by specifying a new key-value pair.
func (t *SimpleAsset) Invoke(stub shim.ChaincodeStubInterface) peer.Response {
	// Extract the function and args from the transaction proposal
	fn, args := stub.GetFunctionAndParameters()

	var result string
	var err error
	if fn == "set" {
		result, err = set(stub, args)
	} else if fn == "get" {
		result, err = get(stub, args)
	} else if fn == "getAllKeys" {
		result, err = getAllKeys(stub)
	} else if fn == "changeKeyOwner" {
		result, err = changeKeyOwner(stub, args)
	} else {
		return shim.Error("Not supported chaincode function.")
	}

	if err != nil {
		return shim.Error(err.Error())
	}

	// Return the result as success payload
	return shim.Success([]byte(result))
}
 
// Set stores the asset (both key and value) on the ledger. If the key exists,
// it will override the value with the new one
func set(stub shim.ChaincodeStubInterface, args []string) (string, error) {
	if len(args) != 5 {
		return "", fmt.Errorf("Incorrect arguments. Expecting a key and a value")
	}

	// JSON  변환
	var data = Data{Index: args[0], Key: args[1], Name: args[2], Owner: args[3], Validity: args[4]}
	dataAsBytes, _ := json.Marshal(data)

	err := stub.PutState(args[0], dataAsBytes)
	if err != nil {
		return "", fmt.Errorf("Failed to set asset: %s", args[0])
	}
	return string(dataAsBytes), nil
}
 
// Get returns the value of the specified asset key
func get(stub shim.ChaincodeStubInterface, args []string) (string, error) {
	if len(args) != 1 {
		return "", fmt.Errorf("Incorrect arguments. Expecting a key")
	}

	value, err := stub.GetState(args[0])
	if err != nil {
		return "", fmt.Errorf("Failed to get asset: %s with error: %s", args[0], err)
	}
	if value == nil {
		return "", fmt.Errorf("Asset not found: %s", args[0])
	}
	return string(value), nil
}
 
// Get returns the value of the specified asset key
func getAllKeys(stub shim.ChaincodeStubInterface) (string, error) {

	iter, err := stub.GetStateByRange("0", "9")
	if err != nil {
		return "", fmt.Errorf("Failed to get all keys with error: %s", err)
	}
	defer iter.Close()

	var buffer string
	buffer = "["

	comma := false
	for iter.HasNext() {
		res, err := iter.Next()
		if err != nil {
			return "", fmt.Errorf("%s", err)
		}
		if comma == true {
			buffer += ","
		}
		buffer += string(res.Value)

		comma = true
	}
	buffer += "]"

	fmt.Println(buffer)

	return string(buffer), nil
}
 
func changeKeyOwner(stub shim.ChaincodeStubInterface, args []string) (string, error) {
	if (len(args) != 2) {
		return "", fmt.Errorf("Incorrect arguments. Expecting a key")
	}

	keyAsBytes, _ := APIStub.GetState(args[0])
	key := Key{}

	json.Unmarshal(keyAsBytes, &key)
	key.Owner = args[1]

	keyAsBytes, _ = json.Marshal(key)
	APIStub.PutState(args[0], keyAsBytes)

	return shim.Success(nil)
}

// main function starts up the chaincode in the container during instantiate
func main() {
	if err := shim.Start(new(SimpleAsset)); err != nil {
		fmt.Printf("Error starting SimpleAsset chaincode: %s", err)
	}
}