const express=require("express");
const path=require("path");
const app=express();

app.use(express.json());
app.use(express.static(path.join(__dirname,"public")));

const required=["ZOHO_CPAAS_API_KEY","CONTACT_TO","SMTP_FROM"];

app.post("/api/contact",async(req,res)=>{
  try{
    const missing=required.filter(k=>!process.env[k]);
    if(missing.length) throw new Error("Missing environment variables: "+missing.join(", "));

    const {name,email,phone,service,message}=req.body||{};
    if(!name||!email||!message){
      return res.status(400).json({message:"Name, email and message are required."});
    }

    const apiKey=String(process.env.ZOHO_CPAAS_API_KEY).trim();
    const authorization=apiKey.toLowerCase().startsWith("zoho-enczapikey ")
      ? apiKey
      : "Zoho-enczapikey "+apiKey;

    const subject="AIRYS Website Enquiry — "+(service||"General Enquiry");
    const textbody=
      "New website enquiry\n\n"+
      "Name: "+name+"\n"+
      "Email: "+email+"\n"+
      "Phone: "+(phone||"-")+"\n"+
      "Service: "+(service||"-")+"\n"+
      "Message:\n"+message;

    const response=await fetch("https://cpaas.zoho.in/v1.1/email",{
      method:"POST",
      headers:{
        "Authorization":authorization,
        "Content-Type":"application/json",
        "Accept":"application/json"
      },
      body:JSON.stringify({
        from:{
          address:process.env.SMTP_FROM,
          name:"AIRYS IT Solutions"
        },
        to:[{
          email_address:{
            address:process.env.CONTACT_TO,
            name:"AIRYS IT Solutions"
          }
        }],
        subject,
        textbody
      })
    });

    const result=await response.json().catch(()=>({}));

    if(!response.ok){
      console.error("Zoho CPaaS API error:",response.status,JSON.stringify(result));
      return res.status(502).json({message:"Email service is temporarily unavailable."});
    }

    res.json({ok:true});
  }catch(error){
    console.error("Contact form error:",error);
    res.status(500).json({message:"Email service is not configured correctly."});
  }
});

app.use((req,res)=>res.sendFile(path.join(__dirname,"public","index.html")));

const PORT=process.env.PORT||3000;
app.listen(PORT,()=>console.log("AIRYS website running on port "+PORT));
