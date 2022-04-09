export default function ConfirmBox(props: {name: string}) {

    return (
        <div className="ActionHolder"><button className="floated PlaceButton" id="slide_start_button" value="Start">Placed by {props.name}</button></div>
    )
}
  