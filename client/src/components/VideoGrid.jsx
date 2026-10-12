import VideoCard from './VideoCard'

function VideoGrid({ videos, classLevel, syllabus, subject, language }) {
  return (
    <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
      {videos.map((video) => (
        <VideoCard
          key={video.id}
          video={video}
          classLevel={classLevel}
          syllabus={syllabus}
          subject={subject}
          language={language}
        />
      ))}
    </div>
  )
}

export default VideoGrid
