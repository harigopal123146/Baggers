var express=require("express");
var app=express();
var fileuploader=require("express-fileupload");
var cloudinary=require("cloudinary").v2;



app.use(express.static("public"));
// const bycrypt=require("bcrypt"); //For Password Encrypt
const bcrypt = require('bcrypt');
var mysql=require("mysql2");
app.use(fileuploader());// File Uploader

// ===============   Gemini AI ==========================
const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI("AIzaSyCwidq0q7jrgGHdzDCZl5MqjjPk6EHyOIA");
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

async function AIFUNCTION(imgurl)
{
const myprompt = "Read the text on picture and tell all the information in adhaar card and give output STRICTLY in JSON format {adhaar_number:'', name:'', gender:'', dob: ''}. Dont give output as string."   
    const imageResp = await fetch(imgurl)
        .then((response) => response.arrayBuffer());

    const result = await model.generateContent([
        {
            inlineData: {
                data: Buffer.from(imageResp).toString("base64"),
                mimeType: "image/jpeg",
            },
        },
        myprompt,
    ]);
    console.log(result.response.text())
            
            const cleaned = result.response.text().replace(/```json|```/g, '').trim();
            const jsonData = JSON.parse(cleaned);
            console.log(jsonData);

    return jsonData

}


let portNo=2004;
  app.listen(portNo,function(){
    console.log("Hello");
})


// ----------------- Aiven connection to node.js --------------------
let url="mysql://avnadmin:AVNS_8wCgRIjlm0iJb7ODBNT@mysql-32b7286a-goyalharry62-1cc5.e.aivencloud.com:21459/defaultdb";
let MysqlCon=mysql.createConnection(url);
MysqlCon.connect(function(err){
  if(err==null)
    console.log("Connected");
  else
    console.log(err.message);

})

app.get("/",function(req,resp){
  // resp.send(__dirname+"<br>"+__filename);
  let fullPath=__dirname+"/public/index.html";
  resp.sendFile(fullPath);
})

// -----------------  Cloudinary----------------- 
 cloudinary.config({ 
            cloud_name: 'de9wpl8q0', 
            api_key: '753214468754716', 
            api_secret: 'sWURNIjfoB9CwiU32Oi8XTA-jfY' // Click 'View API Keys' above to copy your API secret
        });


// -------------------- Signup with Ajax -------------------
app.use(express.urlencoded(true));
app.get("/signup-process-secure", async function (req, resp) {

  let emailid = req.query.txtEmail;
  let pwd = req.query.txtPwd;
  let utype = req.query.txtUtype;

  // Regex
  let emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

  // Validation check
  if (!emailid || !pwd || !utype) {
    return resp.send("All fields are required");
  }

  if (!emailRegex.test(emailid)) {
    return resp.send("Enter valid email");
  }
  try {
    const hashedPwd = await bcrypt.hash(pwd, 11);

    MysqlCon.query(
      "insert into USERS values(?,?,?,current_date(),1)",
      [emailid, hashedPwd, utype],
      function (err) {
        if (err == null)
          resp.send("Record Saved");
        else
          resp.send(err.message);
      }
    );

  } catch (err) {
    resp.send(err.message);
  }
});
app.get("/adminDash",function(req,resp){
    let fullpath = __dirname + "/public/adminDash.html";
  resp.sendFile(fullpath);
})
app.get("/volDash", function(req, resp) {
  let fullpath = __dirname + "/public/dash-vol-ngo.html";
  resp.sendFile(fullpath);
});
app.get("/citizenDash", function(req, resp) {
  let fullpath = __dirname + "/public/citizenDash.html";
  resp.sendFile(fullpath);
});
// ------------------ Login -----------------------------
app.get("/checkUtype", async function (req, resp) {
    let email = req.query.txtEmailL;
    let pwd = req.query.txtPwdL;

    if(email == "admin6@gmail.com" && pwd == "admin123")
      {
        return resp.send("admin");
      }

    MysqlCon.query(
        "select * from USERS where emailid=?",
        [email],
        async function (err, rows) {

            if (err) return resp.send(err);

            if (rows.length === 0)
                return resp.send("invalid id or pass");

            if (rows[0].Status == 0)
                return resp.send("ACCOUNT BLOCKED");

            const match = await bcrypt.compare(pwd, rows[0].pwd);

            if (match)
                return resp.send(rows[0].utype);
            else
                return resp.send("Wrong Password");
        }
    );
});
// --------------- Volunteer ---------------------
app.get("/Volunteer-secure",function(req,resp){
  // resp.send(__dirname+"<br>"+__filename);
  let fullPath=__dirname+"/public/profileVol.html";
  resp.sendFile(fullPath);
})

//--------- Voluenteer Insert ---------
app.post("/Volunteer-secure", async function(req,resp)
{
  let jsonObjStr = JSON.stringify(req.body);
console.log(req.body);

    let aadhaarFileName="No_Pic.jpg" ;
    let profileFileName="No_Pic.jpg" ;
     if(req.files && req.files.aadhaarPic && req.files.profilePic)
    {
        let fullpath1 = __dirname + "/upload/" + req.files.aadhaarPic.name;
        await req.files.aadhaarPic.mv(fullpath1);

        const result1 = await cloudinary.uploader.upload(fullpath1);
        aadhaarFileName = result1.url;

        let fullpath2 = __dirname + "/upload/" + req.files.profilePic.name;
        await req.files.profilePic.mv(fullpath2);

        const result2 = await cloudinary.uploader.upload(fullpath2);
        profileFileName = result2.url;
    }
  
  let emailid=req.body.txtEmailV;
  let name=req.body.txtNameV;
  let contact=req.body.txtPhoneV;
  let address=req.body.txtAddrV;
  let city=req.body.txtCityV;
  let gender=req.body.txtGenderV;
  let occupation=req.body.txtOccuV;
  let volType=req.body.txtTypeV;
  let ngoRegNo = req.body.txtNgoNoV || null;
  let adharurl=aadhaarFileName;
  let picurl=profileFileName;
  MysqlCon.query(
    "insert into Volprofile1 values(?,?,?,?,?,?,?,?,?,?,?)",[emailid,name,contact,address,city,gender,occupation,volType,ngoRegNo,adharurl,picurl],function(callBackErr){
      if(callBackErr == null){
          resp.send("Record Saved");
      }
      else{
          console.log(callBackErr);
          resp.send(callBackErr.sqlMessage || callBackErr.message);
      }
    }
  );
})
// ------------ Volunteer Fetch Data using Ajax ----------
app.get("/findone",function(req,resp){
   let emailid=req.query.txtEmailV;
  MysqlCon.query("select * from Volprofile1 where emailid=?",[emailid],function(err,tableInJsonArray)
  {
    if(tableInJsonArray.length==1)
      resp.send(tableInJsonArray);
    else
      resp.send("Invalid User/Email ID")

  })
})

// ------------------- Update Volunteer Profile ------------- 
app.post("/doUpdate", async function(req,resp)
{
  let jsonObjStr = JSON.stringify(req.body);
console.log(req.body);

    let aadhaarFileName="No_Pic.jpg" ;
    let profileFileName="No_Pic.jpg" ;
    
    if(req.files!=null)
    {
        aadhaarFileName=req.files.aadhaarPic.name;
    let fullpath1=__dirname+"/upload/"+aadhaarFileName;
    req.files.aadhaarPic.mv(fullpath1);
    // try{
    await cloudinary.uploader.upload(fullpath1).then(function(picUrlResult1)
    {
        aadhaarFileName=picUrlResult1.url;   //will give u the url of ur pic on cloudinary server
        console.log(aadhaarFileName);
        
    })
    
    profileFileName=req.files.profilePic.name;
    
    let fullpath2=__dirname+"/upload/"+profileFileName;
    req.files.profilePic.mv(fullpath2);
    
     await cloudinary.uploader.upload(fullpath2).then(function(picUrlResult2)
     {
         profileFileName=picUrlResult2.url;   //will give u the url of ur pic on cloudinary server
         console.log(profileFileName);
    });
  }
  else
  {

    aadhaarFileName=req.body.hdnAdhar;
    profileFileName=req.body.hdnProfile;

  }

  let emailid=req.body.txtEmailV;
  let name=req.body.txtNameV;
  let contact=req.body.txtPhoneV;
  let address=req.body.txtAddrV;
  let city=req.body.txtCityV;
  let gender=req.body.txtGenderV;
  let occupation=req.body.txtOccuV;
  let volType=req.body.txtTypeV;
  let ngoRegNo=req.body.txtNgoNoV;
  let adharurl=aadhaarFileName;
  let picurl=profileFileName;
   console.log("Update")
  MysqlCon.query("update Volprofile1 set name=?,contact=?,address=?,city=?,gender=?,occupation=?,volType=?,volNgoNo=?, adharurl=?,picurl=? where emailid=?",[name,contact,address,city,gender,occupation,volType,ngoRegNo,adharurl,picurl,emailid],function(callBackErr)
  {
     if(callBackErr==null)
       resp.send("Record Saved");
      else
        resp.send(callBackErr.message);
  })
})


// --------------- Bagger-details  -------------------
app.get("/Bagger-Details",function(req,resp){
  let fullPath=__dirname+"/public/details-bagger.html";
  resp.sendFile(fullPath);
})


//--------------- Bagger-details Insert --------------
// app.post("/Bagger-Details", async function(req,resp)
// {
//   let jsonObjStr = JSON.stringify(req.body);
// console.log(req.body);

//   let ProofPicB="No_Pic.jpg" ;
//   let profilePic="No_Pic.jpg" ;

//     let  aiJsonData;
//     if(req.files!=null)
//     {
//         ProofPicB=req.files.baggerProofPic.name;
//     let fullpath1=__dirname+"/upload/"+ProofPicB;
//     req.files.baggerProofPic.mv(fullpath1);
//      try{
//     await cloudinary.uploader.upload(fullpath1).then(async function(picUrlResult1)
//     {
//         ProofPicB=await picUrlResult1.url;   //will give u the url of ur pic on cloudinary server
//         console.log(ProofPicB);
//          aiJsonData=await AIFUNCTION(picUrlResult1.url);
//         // resp.send(aiJsonData);
        
//     })
//   }
//   catch(err){
//     console.log(JSON.stringify(err));
//     // resp.send(err.message);
//   }
  
//   if (req.files && req.files.baggerPic) {
//   let fullpath2 = __dirname + "/upload/" + req.files.baggerPic.name;

//   await req.files.baggerPic.mv(fullpath2);

//   try {
//     const result = await cloudinary.uploader.upload(fullpath2);
//     profilePic = result.url; 
//   } catch (err) {
//     console.log("Cloudinary error:", err.message);
//     profilePic = "No_Pic.jpg"; // fallback
//   }
// }
// }


//   let emailid=req.body.baggerEmailV;
//   let name=aiJsonData.name;
//   let age=aiJsonData.dob;
//   let gender=aiJsonData.gender;
//   let address=req.body.baggerAddress;
//   let city=req.body.baggerCity;
//   let typeOfWork=req.body.baggerTypeOfWork;
//   let contact=req.body.baggerContact;
//   let adharNo=aiJsonData.adhaar_number;

//   let proffUrl=ProofPicB;
//   let picurl= profilePic;
//   console.log(picurl)


//   MysqlCon.query("insert into baggers values(?,?,?,?,?,?,?,?,?,?,?)",[emailid,name,age,gender,address,city,typeOfWork,contact,adharNo,proffUrl,picurl],function(callBackErr)
//   {
//      if(callBackErr==null)
//           resp.send("Record Save");
//       else
//         resp.send(callBackErr.message);
//   })
// })




app.post("/Bagger-Details", async function (req, resp) {
  try {
    console.log("BODY:", req.body);

    let ProofPicB = "No_Pic.jpg";
    let profilePic = "No_Pic.jpg";
    let aiJsonData = null;

    // =========================
    // ✅ FIRST IMAGE (Proof Pic)
    // =========================
    if (req.files && req.files.baggerProofPic) {
      try {
        let file1 = req.files.baggerProofPic;
        let fullpath1 = __dirname + "/upload/" + file1.name;

        await file1.mv(fullpath1);

        const result1 = await cloudinary.uploader.upload(fullpath1);
        ProofPicB = result1.url;

        console.log("ProofPic URL:", ProofPicB);

        // ✅ Call AI safely
        try {
          aiJsonData = await AIFUNCTION(result1.url);
          console.log("AI DATA:", aiJsonData);
        } catch (aiErr) {
          console.log("❌ AI ERROR:", aiErr.message);
          aiJsonData = null; // prevent crash
        }

      } catch (err) {
        console.log("❌ ProofPic Upload Error:", err.message);
      }
    }

    // =========================
    // ✅ SECOND IMAGE (Profile Pic)
    // =========================
    if (req.files && req.files.baggerPic) {
      try {
        let file2 = req.files.baggerPic;
        let fullpath2 = __dirname + "/upload/" + file2.name;

        await file2.mv(fullpath2);

        const result2 = await cloudinary.uploader.upload(fullpath2);
        profilePic = result2.url;

        console.log("ProfilePic URL:", profilePic);

      } catch (err) {
        console.log("❌ ProfilePic Upload Error:", err.message);
      }
    }

    // =========================
    // ✅ SAFE DATA EXTRACTION
    // =========================
    let emailid = req.body.baggerEmailV || "";
    let address = req.body.baggerAddress || "";
    let city = req.body.baggerCity || "";
    let typeOfWork = req.body.baggerTypeOfWork || "";
    let contact = req.body.baggerContact || "";

    // ✅ AI SAFE VALUES (NO CRASH)
    let name = "";
    let age = "";
    let gender = "";
    let adharNo = "";

    if (aiJsonData) {
      name = aiJsonData.name || "";
      age = aiJsonData.dob || "";
      gender = aiJsonData.gender || "";
      adharNo = aiJsonData.adhaar_number || "";
    } else {
      console.log("⚠️ AI data missing, using fallback values");
    }

    console.log("FINAL PROFILE PIC:", profilePic);

    // =========================
    // ✅ DATABASE INSERT
    // =========================
    MysqlCon.query(
      "insert into baggers values(?,?,?,?,?,?,?,?,?,?,?)",
      [
        emailid,
        name,
        age,
        gender,
        address,
        city,
        typeOfWork,
        contact,
        adharNo,
        ProofPicB,
        profilePic,
      ],
      function (err) {
        if (err) {
          console.log("❌ DB ERROR:", err.message);
          return resp.status(500).send(err.message);
        }

        resp.send("✅ Record Saved Successfully");
      }
    );

  } catch (err) {
    console.log("❌ SERVER ERROR:", err.message);
    resp.status(500).send("Something went wrong");
  }
});


// ------------- DashBoard ---------------
app.get("/dasdboard",function(req,resp){
  let fullpath=__dirname+"/public/dash-vol-ngo.html";
  resp.sendFile(fullpath);
})

//-------------- Password update ----------
app.post("/setting", function(req, resp){

    let DashEmail = req.body.DashEmail;
    let DashOldPwd = req.body.DashOldPwd;
    let DashNewPwd = req.body.DashNewPwd;

    // Validation
    if (!DashEmail || !DashOldPwd || !DashNewPwd) {
        return resp.send("All fields are required");
    }

    if (DashNewPwd.length < 6) {
        return resp.send("Password must be at least 6 characters");
    }

    // Step 1: Get user
    MysqlCon.query(
        "SELECT * FROM USERS WHERE emailid=?",
        [DashEmail],
        async function(err, result){

            if (err) return resp.send(err.message);

            if (result.length === 0) {
                return resp.send("User not found");
            }

            let storedHash = result[0].pwd;

            // Step 2: Compare old password
            let match = await bcrypt.compare(DashOldPwd, storedHash);

            if (!match) {
                return resp.send("Invalid old password");
            }

            // Step 3: Hash new password
            let newHash = await bcrypt.hash(DashNewPwd, 10);

            // Step 4: Update password
            MysqlCon.query(
                "UPDATE USERS SET pwd=? WHERE emailid=?",
                [newHash, DashEmail],
                function(error){
                    if (error)
                        resp.send(error.message);
                    else
                        resp.send("Password Updated Successfully");
                }
            );
        }
    );
});
// ----------------Citizen Insertion ----------------------
app.get("/Citizen-Profile",function(req,resp){
  let fullpath=__dirname+"/public/profileCitizen.html";
  resp.sendFile(fullpath);
})
app.post("/Citizen-Profile", async function(req,resp)
{
  let jsonObjStr = JSON.stringify(req.body);
console.log(req.body);

    let aadhaarFront ="No_Pic.jpg";
    let aadhaarBack="No_Pic.jpg" ;
    
    if(req.files!=null)
    {
        aadhaarFront=req.files.txtAdhrCitiFro.name;
    let fullpath1=__dirname+"/upload/"+aadhaarFront;
    req.files.txtAdhrCitiFro.mv(fullpath1);
    // try{
    await cloudinary.uploader.upload(fullpath1).then(function(picUrlResult1)
    {
        aadhaarFront=picUrlResult1.url;   //will give u the url of ur pic on cloudinary server
        console.log(aadhaarFront);
        
    })
    
    aadhaarBack=req.files.txtAdhrCitiBack.name;
    
    let fullpath2=__dirname+"/upload/"+aadhaarBack;
    req.files.txtAdhrCitiBack.mv(fullpath2);
    
     await cloudinary.uploader.upload(fullpath2).then(function(picUrlResult2)
     {
         aadhaarBack=picUrlResult2.url;   //will give u the url of ur pic on cloudinary server
         console.log(aadhaarBack);
    });
  }
  
  let emailid=req.body.txtEmailCit;
   let adharFronturl=aadhaarFront;
  let adharBackurl=aadhaarBack;
  let contact=req.body.txtmobileCit;
  let name=req.body.txtNameCit;
   let adharNo=req.body.txtAdrNoCit;
  let fatherName=req.body.txtFatherNameCit;
  let dob=req.body.txtdobCit;
  let gender=req.body.txtGenderCit;
   let address=req.body.txtAddrCit;
  let city=req.body.txtCityCit;

  MysqlCon.query("insert into citizenProfile values(?,?,?,?,?,?,?,?,?,?,?)",[emailid,adharFronturl,adharBackurl,contact,name,adharNo,fatherName,dob,gender,address,city],function(callBackErr)
  {
     if(callBackErr==null)
          resp.redirect("/Citizen-Dashboard")
      else
        resp.send(callBackErr.message);
  })
})
//----------------- ADMIN - DASHBOARD  --------------------
app.get("/adminDash",function(req,resp){
  
    let fullpath= __dirname+"/public/adminDash.html";
  resp.sendFile(fullpath);

})

app.get("/UserManager",function(req,resp)
{
        let fullPath=__dirname+"/public/all-Users.html";
        resp.sendFile(fullPath);
})

app.get("/Volunteer",function(req,resp)
{
        let fullPath=__dirname+"/public/all-volunteer.html";
        resp.sendFile(fullPath);
})

app.get("/Citizens",function(req,resp)
    {
        let fullPath=__dirname+"/public/all-Citizens.html";
        resp.sendFile(fullPath);
    })

app.get("/Baggers",function(req,resp)
    {
        let fullPath=__dirname+"/public/all-Baggers.html";
        resp.sendFile(fullPath);
    })   

// ********************* Angular ************************************

//---------------- User Manager ---------------------------
app.get("/angular-fetchUsers",function(req,resp){
  MysqlCon.query("select * from USERS",function(err,tableInJsonArray)
  {
    resp.send(tableInJsonArray);

  })
})

app.get("/angular-userBlock",function(req,resp)
{
  let email=req.query.emailid;

  MysqlCon.query("update USERS set Status=0 where emailid=?",[email],function(callBackerr)
    {
        if(callBackerr==null)
          resp.send("blocked");

        else
          resp.send(callBackerr.message)
    })
})

app.get("/angular-userResume",function(req,resp)
{
  let email=req.query.emailid;

  MysqlCon.query("update USERS set Status=1 where emailid=?",[email],function(callBackerr)
    {
        if(callBackerr==null)
          resp.send("UnBlocked");

        else
          resp.send(callBackerr.message)
    })
})


// ----------------------- Volunteer Record -------------------------
app.get("/angular-fetchVolunteer",function(req,resp){
  MysqlCon.query("select * from Volprofile1",function(err,tableInJsonArray)
  {
    resp.send(tableInJsonArray);

  })
})
// ----------------------- Bagger Record ---------------------------------
app.get("/angular-fetchBaggers",function(req,resp){
  MysqlCon.query("select * from baggers",function(err,tableInJsonArray)
  {
    resp.send(tableInJsonArray);

  })
})


// ---------------------- Citizen Record ----------------------------------
app.get("/angular-fetchCitizen",function(req,resp){
  MysqlCon.query("select * from citizenProfile ",function(err,tableInJsonArray)
  {
    resp.send(tableInJsonArray);

  })
})

//----------------------- Find worker ------------------------------
app.get("/angular-FindWorker",function(req,resp){
  let fullpath=__dirname+"/public/find-Worker.html";
  resp.sendFile(fullpath);
})

app.get("/angular-FindWorker-work",function(req,resp){
  MysqlCon.query("select distinct worktype from baggers ",function(err,tableInJsonArray)
  {
    resp.send(tableInJsonArray);
  })
})

app.get("/angular-FindWorker-city",function(req,resp){
  MysqlCon.query("select distinct city from baggers",function(err,tableInJsonArray)
  {
    resp.send(tableInJsonArray);
  })
})

app.get("/fetchWorkers", function(req, resp) {

  let work = req.query.worktype;
  let city = req.query.city;

  let query = "SELECT * FROM baggers WHERE worktype=? AND city=?";

  MysqlCon.query(query, [work, city], function(err, result) {
    if (err) {
      resp.send(err);
    } else {
      resp.send(result);
    }
  });

});

//============== Bagger Details in modal ==========================

app.get("/angular-fetchBaggers",function(req,resp){
  MysqlCon.query("select * from baggers",function(err,tableInJsonArray)
  {
    resp.send(tableInJsonArray);

  })
})

app.get("/citizen-dashboard", function(req, resp){
  let fullpath = __dirname + "/public/citizenDash.html";
  resp.sendFile(fullpath);
});
//===========================
app.get("/angular-Baggers", function(req, resp) {
  let email = req.query.email;

  MysqlCon.query("SELECT * FROM baggers WHERE volid = ?",    [email],
    function(err, tableInJsonArray) {
      if (err) {
        resp.send(err);
      } else {
        resp.send(tableInJsonArray);
      }
    }
  );
});
app.get("/angular-user-delete",function(req,resp){
  let volid=req.query.volid;
  MysqlCon.query("delete from baggers where volid=?",[volid],function(err,result){
      if(err==null)
      {
        if(result.affectedRows==1)
         resp.send("Record Deleted");
        else
          resp.send("Invalid Email Id");

      }
       
      else
        resp.send(err.message);
  })
})