import React, {useEffect,useState} from "react";
import {ethers} from "ethers";
import {contractABI,contractAddress} from "../utils/constants"


export const TransactionsContext=React.createContext();

const {ethereum}=window;

const getEthereumContract=()=>{
    const provider= new ethers.providers.Web3Provider(ethereum);
    const signer =provider.getSigner();
    const transactionContract=new ethers.Contract(contractAddress,contractABI,signer);
    return transactionContract;   
}

export const TransactionProvider=({children})=>{
    const[currentAccount,setCurrentAccount]= useState("");
    // formData
    const [formData,setFormData]=useState({addressTo:'',amount:'',keyword:'',message:''});

    const [isLoading,setIsLoading]=useState(false);

    const [transactionCount,setTransactionCount]=useState(localStorage.getItem('transactionCount'));
    
    const [transactions, setTransactions] = useState([]);

   

    
    const handleChange=(e,name)=>{
        setFormData((prevState)=>({...prevState,[name]:e.target.value}))
    }

    const getAllTransactions=async()=>{
        try{
            if(!ethereum) return alert("Please install Metamask");
            const transactionContract =  getEthereumContract();
            const availableTransactions = await transactionContract.getAllTransactions();
            const structuredTransactions = availableTransactions.map((transaction) => ({
                addressTo: transaction.receiver,
                addressFrom: transaction.sender,
                timestamp: new Date(transaction.timestamp.toNumber() * 1000).toLocaleString(),
                message: transaction.message,
                keyword: transaction.keyword,
                amount: parseInt(transaction.amount._hex) / (10 ** 18)
              }));
            console.log(structuredTransactions);
            setTransactions(structuredTransactions);
        }catch{

        }
    }

    const checkIfwalletIsConnected=async()=>{
        // chck for metamask installed or not 
        try{
        if(!ethereum) return alert("Please install Metamask");
        const accounts=await ethereum.request({method:"eth_accounts",});
        // check if acoount already present when page is loaded 
        if(accounts.length){
            setCurrentAccount(accounts[0]);
            getAllTransactions();
        }else{
            console.log("No accounts found");
        }
    }catch(error){
        console.log(error);
        throw new Error("No Ethereum Object");
    }
    }

    const checkIfTransactionsExists=async()=>{
        try{
            const transactionContract =  getEthereumContract();
            const transactionCount=await transactionContract.getTransactionCount();

            window.localStorage.setItem("transactinCount",transactionCount)

        }catch(error){
            console.log(error);
            throw new Error("No ethereum object");
        }
    }

    // connect wallet after the metamask is installed 

    const connectWallet=async()=>{
        try{
            if(!ethereum) return alert("Please install Metamask");
            const accounts=await ethereum.request({method:"eth_requestAccounts",});
            setCurrentAccount(accounts[0]);
        }catch(error){
           console.log(error);
           throw new Error("No Ethereum Object");
        }
    }

    const sendTransaction=async()=>{
        try{
            if(!ethereum) return alert("Please install Metamask");
            const{addressTo,amount,keyword,message}=formData;
            const transactionContract =  getEthereumContract();
            const parsedAmount=new ethers.utils.parseEther(amount);
            await ethereum.request({
                method:'eth_sendTransaction',
                params:[{
                    from:currentAccount,
                    to:addressTo,
                    gas:'0x5208', //21000 GWEI
                    value: parsedAmount._hex,
                }]
            })
            const transactionHash=await  transactionContract.addToBlockchain(addressTo,parsedAmount,message,keyword);
            setIsLoading(true);
            alert(`Loading-${transactionHash.hash}`);
            await transactionHash.wait();
            setIsLoading(false);
            alert(`Success-${transactionHash.hash}`);
           
            const transactionCount=await transactionContract.getTransactionCount();
            setTransactionCount(transactionCount.toNumber())
            window.reload();

        }catch(error){
            console.log(error);
            throw new Error("No Ethereum Object");

        }
    }





//   check if wallet is connected only when the page is first loaded 
    useEffect(()=>{
        checkIfwalletIsConnected();
        checkIfTransactionsExists();
    },[])

    return (
        <TransactionsContext.Provider value={{connectWallet,currentAccount,formData,sendTransaction,transactionCount,transactions,handleChange,isLoading}}>
            {children}
        </TransactionsContext.Provider>
    )
}