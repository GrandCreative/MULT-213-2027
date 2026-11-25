import profilePic from './assets/uwunimogchan.jpg';

export default function Profile(props) {

 return (

 <>
 
 <img src={profilePic} alt="Profile picture" />
 <h1>{props.name}</h1>
 <p>{props.bio}</p>

</>
 )
}