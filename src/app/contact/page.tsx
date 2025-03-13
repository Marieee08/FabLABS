"use client"
import Link from "next/link"
import { FormEvent } from "react"

export default function Contact() {
  function handleSubmit(event: FormEvent<HTMLFormElement>): void {
    throw new Error("Function not implemented.")
  }

    return (
        <main className="flex min-h-screen flex-col items-center" >
            <div className="relative flex place-items-center p-5 bg-white text-black">
                <Link href="/">Home</Link>
            </div>

            <form onSubmit={handleSubmit} className="mt-8 mb-2 w-80 max-w-screen-lg sm:w-96">
                <div className="mb-4 flex flex-col w-500">

                    <label htmlFor="form-name">Name </label>
                    <input id="form-name" autoComplete="name" maxLength={50} size="lg" name="name" className="text-black"/>

                    <label htmlFor="form-email"> Email:</label>
                    <input id="form-email" required autoComplete="email" maxLength={80} name="email" type="email" className="text-black"/>

                    <label htmlFor="form-message"> Message: </label>
                    <textarea id="form-message" required name="message" rows={5} className="text-black"/>

                </div>
                <button className=" rounded bg-sky-400" type="submit">Send</button>
            </form>
        </main>
    )
}