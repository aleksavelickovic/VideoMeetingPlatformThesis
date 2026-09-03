import {Routes} from '@angular/router'
import {CreateMeetingPageComponent} from './pages/create-meeting-page.component'
import {MeetingCreatedPageComponent} from './pages/meeting-created-page.component'
import {PreJoinPageComponent} from './pages/pre-join-page.component'
import {InCallPageComponent} from './pages/in-call-page.component'
import {PostCallPageComponent} from './pages/post-call-page.component'
import {ParticipantEgressTemplateComponent} from './pages/participant-egress-template.component'
import {ProfilePageComponent} from './pages/profile-page.component'
import {MyMeetingsPageComponent} from './pages/my-meetings-page.component'

export const routes: Routes = [
    {path: 'egress/participant', component: ParticipantEgressTemplateComponent},
    {path: '', component: CreateMeetingPageComponent},
    {path: 'meeting-created', component: MeetingCreatedPageComponent},
    {path: 'room/:roomId', component: PreJoinPageComponent},
    {path: 'call/:roomId', component: InCallPageComponent},
    {path: 'post-call', component: PostCallPageComponent},
    {path: 'profile', component: ProfilePageComponent},
    {path: 'my-meetings', component: MyMeetingsPageComponent},
    {path: '**', redirectTo: ''}
]
