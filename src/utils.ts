export const AVATAR_COLORS = ['#c0834a', '#3b82f6', '#8e44ad', '#27ae60', '#e67e22', '#e74c3c', '#1abc9c']
export const avatarColor = (id: string) => AVATAR_COLORS[id.charCodeAt(0) % AVATAR_COLORS.length]
export const initials    = (name: string) => name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase()
export const shortId     = (id: string)   => `#${id.slice(-6).toUpperCase()}`
