const express=require("express");
const path=require("path");

const app=express();

app.use(express.json());
app.use(express.urlencoded({extended:true}));
app.use(express.static(path.join(__dirname,"public")));

app.post("/api/contact",async(req,res)=>{
  try{
    const {Name,Business_Email,Phone,Service,Message}=req.body;
    const businessEmail=req.body["Business Email"]||Business_Email;
    if(!Name||!businessEmail||!Message){
      return res.status(400).json({error:"Please provide your name, business email and message."});
    }

    const apiKey=process.env.ZOHO_CPAAS_API_KEY;
    const to=process.env.CONTACT_TO||"support@airysitsolutions.com";
    const from=process.env.SMTP_FROM||"support@airysitsolutions.com";

    if(!apiKey){
      console.error("Missing ZOHO_CPAAS_API_KEY");
      return res.status(500).json({error:"Contact service is not configured yet. Please email support@airysitsolutions.com directly."});
    }

    const subject=`New AIRYS website enquiry — ${Service||"General enquiry"}`;
    const body=[
      `Name: ${Name}`,
      `Business Email: ${businessEmail}`,
      `Phone: ${Phone||"Not provided"}`,
      `Service: ${Service||"Not specified"}`,
      "",
      "Message:",
      Message
    ].join("\n");

    const response=await fetch("https://cpaas.zoho.in/v1.1/email",{
      method:"POST",
      headers:{
        "Content-Type":"application/json",
        "X-API-KEY":apiKey
      },
      body:JSON.stringify({
        from:from,
        to:[to],
        subject:subject,
        text:body
      })
    });

    const result=await response.json().catch(()=>({}));
    if(!response.ok){
      console.error("Zoho CPaaS error:",result);
      return res.status(502).json({error:"We could not send your enquiry right now. Please email support@airysitsolutions.com directly."});
    }

    return res.json({success:true});
  }catch(error){
    console.error("Contact form error:",error);
    return res.status(500).json({error:"We could not send your enquiry right now. Please email support@airysitsolutions.com directly."});
  }
});

app.use((req,res)=>res.sendFile(path.join(__dirname,"public","index.html")));

const PORT=process.env.PORT||3000;
app.listen(PORT,()=>console.log("AIRYS IT Solutions V2 running on "+PORT));
