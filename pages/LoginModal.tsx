import { setCookies } from "cookies-next";
import React, { useState } from "react"

export default function LoginModal(props: { show: boolean }) {
    const show = props.show

    const [name, setName] = useState("");

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        const code = name
        const result = await fetch("/api/login", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ code })
        })
        const data = await result.json()
        if(data.sucess) {
            setCookies('code', code)
            window.location.reload()
        } else
            alert(data.error)
        
    }



    return (
        <>
            {show &&
                <div className="Loginmodal">
                    <div className="Loginmodal-content Center">
                        <form onSubmit={handleSubmit}>
                            <label>Enter your code:
                                <input
                                    type="password"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                />
                            </label>
                            <input type="submit" />
                            <p>too lazy to design this part</p>
                        </form>
                    </div>
                </div>
            }
        </>
    )
}
