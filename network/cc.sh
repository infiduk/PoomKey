  
#chaincode insall
docker exec cli peer chaincode install -n sacc -v 0.1 -p github.com/sacc
#chaincode instatiate
docker exec cli peer chaincode instantiate -n sacc -v 0.1 -C mychannel -c '{"Args":[]}' -P 'OR ("Org1MSP.member", "Org2MSP.member","Org3MSP.member")'
# docker exec cli peer chaincode upgrade -n sacc -v 0.2 -C mychannel -c '{"Args":[]}' -P 'OR ("Org1MSP.member", "Org2MSP.member","Org3MSP.member")'
sleep 5
#chaincode query a
docker exec cli peer chaincode query -n sacc -C mychannel -c '{"Args":["get","2"]}'
#chaincode invoke b
docker exec cli peer chaincode invoke -n sacc -C mychannel -c '{"Args":["set","3","DDEASFS","제품명","소유자1","2019-09-20"]}'
sleep 5
#chaincode query b
docker exec cli peer chaincode query -n sacc -C mychannel -c '{"Args":["get","3"]}'

echo '-------------------------------------END-------------------------------------'