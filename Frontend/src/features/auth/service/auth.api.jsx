import axios from 'axios'

const api = axios.create({
    baseURL: "http://localhost:3000/api/auth",
    withCredentials: true
})

export async function register({name , email , password}){
    try{
        const response =await api.post("/register",{
            name , email , password
        })
        return response.data
    }catch(err){
        console.log(err)
        throw err
    }
}

export async function login({emailorusername, password}){
    try{
        const response =await api.post("/login",{
            emailorusername, password
        })
        return response.data
    }catch(err){
        console.log(err)
        throw err
    }
}

export async function getMe(){
    try{
        const response =await api.get("/get-me")
        return response.data
    }catch(err){
        console.log(err)
        throw err
    }
}