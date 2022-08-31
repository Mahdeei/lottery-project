// SPDX-License-Identifier: MIT

pragma solidity ^0.8.11;

import "@chainlink/contracts/src/v0.8/VRFConsumerBase.sol";

contract Lottery is VRFConsumerBase {
    address public owner;
    uint256 public lotteryStartDate;
    uint256 public startDateNow;
    uint256 public endDatePrevious;
    address payable[] public players;
    uint public lotteryId;
    mapping (uint => address payable) public lotteryHistory;

    bytes32 internal keyHash; // identifies which Chainlink oracle to use
    uint internal fee;        // fee to get random number
    uint public randomResult;

    constructor()
        VRFConsumerBase(
            0xb3dCcb4Cf7a26f6cf6B120Cf5A73875B7BBc655B, // VRF coordinator
            0x01BE23585060835E02B77ef475b0Cc51aA1e0709  // LINK token address
        ) {
            keyHash = 0x2ed0feb3e7fd2022120aa84fab1945545a9f2ffc9076fd6156fa96eaff4c1311;
            fee = 0.1 * 10 ** 18;    // 0.1 LINK

            owner = msg.sender;
            lotteryId = 1;
            lotteryStartDate=block.timestamp;
        }
        

    function getRandomNumber() public payable returns (bytes32 requestId) {
        require(LINK.balanceOf(address(this)) >= fee, "Not enough LINK in contract");
        return requestRandomness(keyHash, fee);
    }

    function fulfillRandomness(bytes32, uint randomness) internal override {
        randomResult = randomness;
    }
    function getOwner() public view returns(address){
        return owner;
    }

    function getWinnerByLottery(uint lottery) public view returns (address payable) {
        return lotteryHistory[lottery];
    }

    function getBalance() public view returns (uint) {
        return address(this).balance;
    }

    function getPlayers() public view returns (address payable[] memory) {
        return players;
    }

    function enter() public payable {
        require(msg.value > .01 ether);

        
        // address of player entering lottery
        players.push(payable(msg.sender));

        if(players.length==1){
            startDateNow=block.timestamp;
        }
    }


    function getlotteryStartDate() public view returns(uint256){
        return lotteryStartDate;
    }

    function getstartDate() public view returns(uint256){
        return startDateNow;
    }

    function getendDate() public view returns(uint256){
        return endDatePrevious;
    }

    function pickWinner() public  payable {
        require(msg.sender == owner);
        getRandomNumber();
    }

    function payWinner() public payable  {
        require(msg.sender == owner);
        require(randomResult > 0, "Must have a source of randomness before choosing winner");
        uint index = randomResult % players.length;
        players[index].transfer(address(this).balance);
        endDatePrevious=block.timestamp;
        startDateNow=0;
        lotteryHistory[lotteryId] = players[index];
        lotteryId++;
        
        // reset the state of the contract
        players = new address payable[](0);
    }
    
}
