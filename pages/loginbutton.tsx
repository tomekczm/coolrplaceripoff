type Props = {
    showLoginPrompt: (_: boolean) => void
}

export default function Loginbutton(props: Props) {
    function onClick(event: React.MouseEvent) {
        props.showLoginPrompt(true)
    }

    return (
        <button className="Loginbutton" onClick={onClick}>Log in</button>
    )
}
  