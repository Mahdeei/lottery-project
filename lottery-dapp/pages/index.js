import { useState, useEffect } from 'react'
import Web3 from 'web3'
import lotteryContract from '../blockchain/lottery'
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';



export default function Home() {
  const [web3, setWeb3] = useState()
  const [address, setAddress] = useState()
  const [lcContract, setLcContract] = useState()
  const [lotteryPot, setLotteryPot] = useState()
  const [lotteryPlayers, setPlayers] = useState([])
  const [lotteryHistory, setLotteryHistory] = useState([])
  const [lotteryId, setLotteryId] = useState()
  const [lotteryStartDate, setLotteryStartDate] = useState('Please connect metamask to show information')
  const [startDateNow, setStartDateNow] = useState('Connect wallet')
  const [endDatePrevious, setEndDatePrevious] = useState('Connect wallet')
  const [lotteryowner, setOwner] = useState('-')
  const [error, setError] = useState('')
  const [successMsg, setSuccessMsg] = useState('')

  useEffect(() => {
    updateState()
  }, [lcContract])

  useEffect(() => {
    if (error)
      toast.error(error, {
        position: "bottom-center",
        autoClose: false,
        hideProgressBar: false,
        closeOnClick: false,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
      })
  }, [error])

  useEffect(() => {
    if (successMsg)
      toast.success(successMsg, {
        position: "bottom-center",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
      })
  }, [successMsg])





  const updateState = () => {
    if (lcContract) getPot()
    if (lcContract) getPlayers()
    if (lcContract) getLotteryId()
    if (lcContract) getLotteryStartDate()
    if (lcContract) getStartDateNow()
    if (lcContract) getEndDatePrevious()
    if (lcContract) getOwner()
  }

  async function convertDate(date) {

    let unix_timestamp = Number(date)
    var date = new Date(unix_timestamp * 1000);
    var year = date.getFullYear();
    var month = date.getMonth() + 1;
    var day = date.getDate();
    var hours = date.getHours();
    var minutes = "0" + date.getMinutes();
    var seconds = "0" + date.getSeconds();
    var formattedTime = year + "-" + month + "-" + day + "-" + hours + ':' + minutes.substr(-2) + ':' + seconds.substr(-2);

    return formattedTime
  }


  const getLotteryStartDate = async () => {
    const lotterystart = await lcContract.methods.getlotteryStartDate().call()
    setLotteryStartDate(await convertDate(lotterystart))
  }

  const getStartDateNow = async () => {
    const start = await lcContract.methods.getstartDate().call()
    if (start != 0) {
      setStartDateNow(await convertDate(start))
    } else {
      setStartDateNow("-")
    }

    // console.log(start + "START")
  }

  const getEndDatePrevious = async () => {
    const end = await lcContract.methods.getendDate().call()
    if (end != 0) {
      setEndDatePrevious(await convertDate(end))
    } else {
      setEndDatePrevious("-")
    }


  }

  const getOwner = async () => {
    const owner = await lcContract.methods.getOwner().call()
    setOwner(owner)
  }



  const getPot = async () => {
    const pot = await lcContract.methods.getBalance().call()
    setLotteryPot(web3.utils.fromWei(pot, 'ether'))
  }

  const getPlayers = async () => {
    const players = await lcContract.methods.getPlayers().call()
    setPlayers(players)
  }

  const getHistory = async (id) => {
    setLotteryHistory([])
    for (let i = parseInt(id); i > 0; i--) {
      const winnerAddress = await lcContract.methods.lotteryHistory(i).call()
      const historyObj = {}
      historyObj.id = i
      historyObj.address = winnerAddress
      setLotteryHistory(lotteryHistory => [...lotteryHistory, historyObj])
    }
  }

  const getLotteryId = async () => {
    const lotteryId = await lcContract.methods.lotteryId().call()
    setLotteryId(lotteryId)
    await getHistory(lotteryId)
  }

  const enterLotteryHandler = async () => {
    setError('')
    setSuccessMsg('')
    try {
      await lcContract.methods.enter().send({
        from: address,
        value: '15000000000000000',
        gas: 300000,
        gasPrice: null
      })
      updateState()
    } catch (err) {




      setError(err.message)

    }
  }

  const pickWinnerHandler = async () => {
    setError('')
    setSuccessMsg('')
    console.log(`address from pick winner :: ${address}`)
    try {
      await lcContract.methods.pickWinner().send({
        from: address,
        gas: 300000,
        gasPrice: null
      })
    } catch (err) {
      setError(err.message)
    }
  }

  const payWinnerHandler = async () => {
    setError('')
    setSuccessMsg('')
    try {
      await lcContract.methods.payWinner().send({
        from: address,
        gas: 300000,
        gasPrice: null
      })
      console.log(`lottery id :: ${lotteryId}`)
      const winnerAddress = await lcContract.methods.lotteryHistory(lotteryId).call()
      setSuccessMsg(`The winner is ${winnerAddress}`)

      updateState()
    } catch (err) {
      setError(err.message)
    }
  }

  const connectWalletHandler = async () => {
    setError('')
    setSuccessMsg('')
    /* check if MetaMask is installed */
    if (typeof window !== "undefined" && typeof window.ethereum !== "undefined") {
      try {



        /* request wallet connection */
        await window.ethereum.request({ method: "eth_requestAccounts" })
        /* create web3 instance & set to state */
        const web3 = new Web3(window.ethereum)
        /* set web3 instance in React state */
        setWeb3(web3)
        /* get list of accounts */
        const accounts = await web3.eth.getAccounts()
        /* set account 1 to React state */
        setAddress(accounts[0])

        /* create local contract copy */
        const lc = lotteryContract(web3)
        setLcContract(lc)

        window.ethereum.on('accountsChanged', async () => {
          const accounts = await web3.eth.getAccounts()
          console.log(accounts[0])
          /* set account 1 to React state */
          setAddress(accounts[0])
        })
      } catch (err) {
        setError(err.message)
      }
    } else {
      /* MetaMask is not installed */
      console.log("Please install MetaMask")
    }
  }


  return (
    <div>
      <header className="has-background-black columns mb-5 py-5">
        <div className="column is-one-third header-side left justify-content-center">
          <span color='red'>
            {`Create Date: ${lotteryStartDate}`}
          </span>

          <a href={`https://etherscan.io/address/${lotteryowner}`} target="_blank">
            {lotteryowner == "-"
              ? ""
              : "Owner : " + `${lotteryowner}`
            }
          </a>
          {/* <span>{`Owner: ${lotteryowner}`}</span> */}
        </div>
        <div className="column is-one-third header-middle">
          <h1 className="">Ethereum lottery</h1>
          <br></br>
          <h3>shiraz university of technology</h3>
        </div>
        <div className="column is-one-third header-side right justify-content-end">
          <button onClick={connectWalletHandler} className="button is-link">Connect Wallet</button>
        </div>
      </header>

      <div className="d-block w-75 mb-5 mx-auto mt-6">
        <div className="about">
          <div className="me">
            <div className="card">
              <div className="card-image">
                <figure className="image is-4by3">
                  <img src="http://localhost:3000/../images/profile.jpg" alt="Placeholder image" />
                </figure>
              </div>
              <div className="card-content">
                <div className="media">
                  <div className="media-left">
                    <figure className="image is-48x48">
                      <img src="http://localhost:3000/../images/etherlogo.webp" alt="Placeholder image" />
                    </figure>
                  </div>
                  <div className="media-content">
                    <p className="title is-4">mahdi khatib</p>
                  </div>
                </div>

                <div className="content">
                  CS student at Shiraz University of Technology. interested in Cyber security ,blockchain, and many other things.
                </div>
              </div>
            </div>
          </div>
          <div className="project">
            <h2 className="mb-3">About This Project</h2>
            <p className="justify-text">
              This project is a lottery smart contract written in Solidity programming language.<br></br>
              A smart contract is a self-executing contract with the terms of the agreement between buyer and seller being directly written into lines of code. 
              The code and the agreements contained therein exist across a distributed, decentralized blockchain network. 
              The code controls the execution, and transactions are trackable and irreversible.<br></br>
              The purpose of this program is for users to connect to this site with their Metamask wallet and participate in the lottery.
              Any user can participate in the lottery and create a smart contract
              can terminate the lottery at any time.
              Note that users cannot have a role in the termination of the lottery and can only participate in this lottery.
              The owner can generate a random number by using the pick winner button and by pressing the pay winner button, 
              she can deposit the money collected in the lottery to the wallet account of the winner.
              This is an open source project whose code is placed in this <a href="https://github.com/Mahdeei/lottery-project" target="_blank">GitHub link. </a> 
              As you can see, the owner cannot deposit the money collected in this lottery to his account, 
              and this is one of the features of the smart contract.
            </p>
          </div>
        </div>
      </div>


      <div className="d-block w-75 my-5 mx-auto mt-6">
        <section className="mt-5">
          <div className="d-flex justify-content-between">

            <div className="card px-5 w-35 maa">
              <section className="mt-5">
                <p>{`Lottery Started Date: ${startDateNow}`}</p>
                <p>{`Previous Lottery End Date: ${endDatePrevious}`} <i class="bi bi-calendar-date-fill"></i> </p>
                <br></br>
                <p>Enter the lottery by sending 0.015 Ether</p>
                <button onClick={enterLotteryHandler} className="button is-link is-large is-light mt-3">Play now</button>
              </section>
              <section className="mt-5">
                <p><b>Admin only:</b> Pick winner</p>
                <button onClick={pickWinnerHandler} className="button is-primary is-large is-light mt-3">Pick Winner</button>
              </section>
              <section className="mt-5">
                <p><b>Admin only:</b> Pay winner</p>
                <button onClick={payWinnerHandler} className="button is-success is-large is-light mt-3">Pay Winner</button>
              </section>
            </div>

            <div className="w-60">
              <section className="mt-5">
                <div className="card">
                  <div className="card-content">
                    <div className="content">
                      <h2>Lottery History</h2>
                      {
                        (lotteryHistory && lotteryHistory.length > 0) && lotteryHistory.map(item => {
                          if (lotteryId != item.id) {
                            return <div className="history-entry mt-3" key={item.id}>
                              <div>Lottery #{item.id} winner:</div>
                              <div>
                                <a href={`https://etherscan.io/address/${item.address}`} target="_blank">
                                  {item.address}
                                </a>
                              </div>
                            </div>
                          }
                        })
                      }
                    </div>
                  </div>
                </div>
              </section>
              <section className="mt-5">
                <div className="card">
                  <div className="card-content">
                    <div className="content">
                      <h2>Players ({lotteryPlayers.length})</h2>
                      <ul className="ml-0">
                        {
                          (lotteryPlayers && lotteryPlayers.length > 0) && lotteryPlayers.map((player, index) => {
                            return <li key={`${player}-${index}`}>
                              <a href={`https://etherscan.io/address/${player}`} target="_blank">
                                {player}
                              </a>
                            </li>
                          })
                        }
                      </ul>
                    </div>
                  </div>
                </div>
              </section>
              <section className="mt-5">
                <div className="card">
                  <div className="card-content">
                    <div className="content">
                      <h2>Pot</h2>
                      <p>{lotteryPot} Ether</p>
                    </div>
                  </div>
                </div>
              </section>
            </div>
          </div>
        </section>
      </div>

      <footer className="d-flex justify-content-center my-5 mt-6">
        <p>&copy; 2022 Block Explorer</p>
      </footer>ّ
      <ToastContainer />
    </div>
  )
}
