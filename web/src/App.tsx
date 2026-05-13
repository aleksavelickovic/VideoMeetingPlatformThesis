import {BrowserRouter, Routes, Route, Navigate} from 'react-router-dom'
import {PreJoinPage} from './pages/PreJoinPage'
import {InCallPage} from './pages/InCallPage'
import {PostCallPage} from './pages/PostCallPage.tsx'
import {CreateMeetingPage} from './pages/CreateMeetingPage'
import {MeetingCreatedPage} from './pages/MeetingCreatedPage'
import {ErrorBoundary} from './components/ErrorBoundary'

export default function App() {
    return (
        <ErrorBoundary>
            <BrowserRouter future={{v7_startTransition: true, v7_relativeSplatPath: true}}>
                <Routes>
                    <Route path="/" element={<CreateMeetingPage/>}/>
                    <Route path="/meeting-created" element={<MeetingCreatedPage/>}/>
                    <Route path="/room/:roomId" element={<PreJoinPage/>}/>
                    <Route path="/call/:roomId" element={<InCallPage/>}/>
                    <Route path="/post-call" element={<PostCallPage/>}/>
                    <Route path="*" element={<Navigate to="/" replace/>}/>
                </Routes>
            </BrowserRouter>
        </ErrorBoundary>
    )
}