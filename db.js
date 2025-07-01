const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const databaseAddUser = async (nama,notelp, nama_lengkap, email, instansi) => {

    console.log("db add user : ", nama, notelp, nama_lengkap, email, instansi);
    

    const getuser = await prisma.users.findFirst({
        where : {
            notelp : notelp,
        }
    })

    if (!getuser){
        const addNewUser = await prisma.users.create({
            data : {
                nama : nama,
                nama_lengkap : nama_lengkap || "",
                notelp : notelp,
                email : email || "",
                instansi : instansi || "",
            }
        })
        return 0;
    }else{
        const updateUser = await prisma.users.update({
            where: {
                id: getuser.id,
            },
            data: {
                nama_lengkap: nama_lengkap,
                email: email,
                instansi: instansi,
            }
        });
        return 1;
    }
}

const databaseAddDataLayanan = async (layanan,data,notelp,time) => {

    console.log("db add data layanan : ", layanan, data, notelp, time);

    const getuser = await prisma.users.findFirst({
        where : {
            notelp : notelp,
        }
    })

    if (!getuser) {
        throw new Error('User tidak ditemukan');
    }

    const addDataLayanan = await prisma.dataLayanan.create({
        data : {
            user_id : getuser.id,
            layanan : layanan,
            data : data,
            time : time,
        }
    })

    return getuser.id;
}

const databasePushChat = async (id,chat) => {
    console.log("db push chat", chat);

    const pushChat = await prisma.dataLayanan.update({
        where : {
            id : id,
        },
        data: {
            chat : chat,
        }
    })
    
}

module.exports = {
    databaseAddUser, databaseAddDataLayanan, databasePushChat
}