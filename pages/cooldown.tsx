export default function Cooldown(props: { timeLeft: string }) {
    return (
        <div className="Cooldown">
            <h1>{props.timeLeft}</h1>
        </div>
    )
}
  