// app/api/register/route.ts
import { NextRequest, NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"
import bcrypt from "bcrypt"

const prisma = new PrismaClient()

/*
CORS HEADERS
*/

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization"
  }
}

/*
HANDLE PREFLIGHT REQUEST
*/

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: corsHeaders()
  })
}

/*
REGISTER USER
*/

export async function POST(req: NextRequest) {

  try {

    const body = await req.json()
    const { mobile, password, name } = body

    if (!mobile || !password) {
      return NextResponse.json(
        { message: "Mobile and password are required" },
        {
          status: 400,
          headers: corsHeaders()
        }
      )
    }

    const existing = await prisma.user.findUnique({
      where: { mobile }
    })

    if (existing) {
      return NextResponse.json(
        { message: "User already exists" },
        {
          status: 400,
          headers: corsHeaders()
        }
      )
    }

    const hashed = await bcrypt.hash(password, 10)

    const user = await prisma.user.create({
      data: {
        mobile,
        password: hashed,
        name
      }
    })

    return NextResponse.json(
      {
        id: user.id,
        mobile: user.mobile,
        name: user.name
      },
      {
        status: 201,
        headers: corsHeaders()
      }
    )

  }
  catch (error) {

    console.error("Register error:", error)

    return NextResponse.json(
      { message: "Server error" },
      {
        status: 500,
        headers: corsHeaders()
      }
    )

  }

}