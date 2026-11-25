import Profile from './profile.jsx';
import Button from './linkbutton.jsx';

const links = [

  { id: 1, label: "Facebook", url: "https://www.youtube.com/watch?v=xvFZjo5PgG0", featured: true },
  { id: 2, label: "Instagram", url: "https://www.youtube.com/watch?v=xvFZjo5PgG0", featured: false },
  { id: 3, label: "LinkedIn", url: "https://www.youtube.com/watch?v=xvFZjo5PgG0", featured: false },
];


function App() {
  return (

    <>

      <Profile name="Jerid Mitchell" bio="I am currently in the Interactive Design and Technology program at Saskatchewan Polytechnic in Regina." />

    </>
  );
}

export default App;