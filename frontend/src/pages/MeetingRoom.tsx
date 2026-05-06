
import { useParams, useNavigate } from 'react-router-dom';

const MeetingRoom = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  return (
    <div className="page-container meeting-room">
      <div className="video-grid">
        <div className="video-placeholder">
          <p>Local Video (Meeting ID: {id})</p>
        </div>
      </div>
      <div className="meeting-controls">
        <button className="btn-secondary" onClick={() => navigate('/')}>Leave Meeting</button>
      </div>
    </div>
  );
};

export default MeetingRoom;
